import { supabase } from './supabase';

function sb() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

/** Kick off Google OAuth (redirects back to this origin). */
export function signInWithGoogle() {
  return sb().auth.signInWithOAuth({
    provider: 'google',
    options: { queryParams: { prompt: 'select_account' }, redirectTo: window.location.origin },
  });
}

/** Email + password sign-in. */
export function signInWithEmail(email: string, password: string) {
  return sb().auth.signInWithPassword({ email, password });
}

/** Email + password sign-up. Passwords are hashed and stored by Supabase Auth.
 *  `username` rides along as user metadata so the DB trigger can save it. */
export function signUpWithEmail(email: string, password: string, username?: string) {
  return sb().auth.signUp({ email, password, options: username ? { data: { username } } : undefined });
}

export const signOut = () => sb().auth.signOut();

/**
 * Optional: restrict sign-in to an institutional domain (e.g. gatech.edu).
 * Not enforced by default. Call this after a session resolves if you want to
 * lock the app to one domain — it signs out anyone whose email doesn't match.
 */
export async function enforceDomain(domain: string): Promise<boolean> {
  const { data } = await sb().auth.getUser();
  const email = data.user?.email ?? '';
  if (email && !email.endsWith(`@${domain}`)) {
    await sb().auth.signOut();
    return false;
  }
  return true;
}
