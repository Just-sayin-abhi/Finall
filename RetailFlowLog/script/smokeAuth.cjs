async function main() {
  const base = "http://localhost:5000";
  const email = `user${Date.now()}@example.com`;
  const password = "Password123!";

  const signup = await fetch(`${base}/api/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      firstName: "Test",
      lastName: "User",
    }),
  });
  console.log("signup", signup.status);

  const login = await fetch(`${base}/api/login/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  console.log("login", login.status);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

