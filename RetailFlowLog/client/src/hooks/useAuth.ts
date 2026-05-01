import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

const FORCE_LOGOUT_KEY = ["forcedLogout"];

export function setLoggedOut() {
  queryClient.setQueryData(FORCE_LOGOUT_KEY, true);
}

export function clearLoggedOut() {
  queryClient.setQueryData(FORCE_LOGOUT_KEY, false);
}

export function useAuth() {
  const { data: forcedOut = false } = useQuery<boolean>({
    queryKey: FORCE_LOGOUT_KEY,
    queryFn: () => false,
    enabled: false,
    initialData: false,
    staleTime: Infinity,
    retry: false,
  });

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user: forcedOut ? undefined : user,
    isLoading: forcedOut ? false : isLoading,
    isAuthenticated: !forcedOut && !!user,
  };
}
