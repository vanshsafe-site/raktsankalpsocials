// Copy/paste helper snippets for auth actions (supabase-js v2)
// These are examples only — call from your UI components as needed.

import { supabase } from "@/integrations/supabase/client";

/* Sign up */
export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

/* Sign in */
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/* Sign out */
export async function signOut() {
  return supabase.auth.signOut();
}

/* Change password (user must be signed in) */
export async function changePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}

/* Get current session */
export async function getSession() {
  return supabase.auth.getSession();
}
