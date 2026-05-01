import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content, context } = req.body;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Non-streaming response for Capacitor WebView compatibility
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are "Your Ayurvedic Dietician", a personalized AI assistant.
Your context:
- Dosha: ${context?.dosha || "Unknown"}
- Health Goal: ${context?.goal || "General Wellness"}
- Recommended Foods: ${JSON.stringify(context?.foods?.recommended || [])}
- Good Foods: ${JSON.stringify(context?.foods?.good || [])}
- Neutral Foods: ${JSON.stringify(context?.foods?.neutral || [])}
- Caution Foods: ${JSON.stringify(context?.foods?.caution || [])}
- Avoid Foods: ${JSON.stringify(context?.foods?.avoid || [])}

Strict Guidelines:
1. Only recommend foods from the "Recommended", "Good", or "Neutral" lists.
2. NEVER suggest foods from the "Avoid" list.
3. Explain WHY specific foods are good or bad based on the user's dosha.
4. Reference the user's specific food list in your responses.
5. Provide practical Indian meal suggestions (Breakfast, Lunch, Dinner).
6. Offer spice recommendations and cooking methods suitable for the dosha.
7. Suggest substitutions using only the allowed foods.`
          },
          ...chatMessages
        ],
        max_tokens: 1024,
      });

      const fullResponse = completion.choices[0]?.message?.content || "";

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.json({ content: fullResponse, done: true });
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}

