import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

type AuthResult = {
  error: string | null;
};

export const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  fullName?: string
): Promise<AuthResult> => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
    },
  });

  return { error: error?.message ?? null };
};

export const getCurrentSession = async (): Promise<Session | null> => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return null;
  }

  return data.session;
};

export const signOutUser = async (): Promise<AuthResult> => {
  const { error } = await supabase.auth.signOut({ scope: "global" });
  return { error: error?.message ?? null };
};

export const signInWithGoogle = async (): Promise<AuthResult> => {
  const redirectTo = `${window.location.origin}/auth`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  return { error: error?.message ?? null };
};

export const signInWithApple = async (): Promise<AuthResult> => {
  const redirectTo = `${window.location.origin}/auth`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: { redirectTo },
  });
  return { error: error?.message ?? null };
};

export const resetPassword = async (email: string): Promise<AuthResult> => {
  const redirectTo = `${window.location.origin}/auth`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  return { error: error?.message ?? null };
};

export const changePassword = async (newPassword: string): Promise<AuthResult> => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error?.message ?? null };
};

export const upsertPublicUser = async (user: User | null): Promise<void> => {
  if (!user) {
    return;
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null;

  await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name: fullName,
    },
    { onConflict: "id" }
  );
};
