"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect } from "react";

export default function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Clear any stale state from localStorage that might be causing authentication issues
  useEffect(() => {
    // If we're running in the browser, clear any potential stale local storage auth state
    if (typeof window !== 'undefined') {
      // This helps prevent stale Next-Auth state in localStorage
      const nextAuthState = localStorage.getItem('next-auth.session-state');
      
      // If there's a stale session state or an error state, we clean it
      if (nextAuthState) {
        try {
          const parsedState = JSON.parse(nextAuthState);
          // If the session state is invalid or expired, remove it
          if (parsedState.expires && new Date(parsedState.expires) < new Date()) {
            localStorage.removeItem('next-auth.session-state');
          }
        } catch {
          // If parsing fails, the state is invalid, so remove it
          localStorage.removeItem('next-auth.session-state');
        }
      }
    }
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}