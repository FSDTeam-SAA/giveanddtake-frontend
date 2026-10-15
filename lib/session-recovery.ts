'use client';
import { getSession, signOut } from 'next-auth/react';

let redirecting = false;
export function expireSession() {
  if (redirecting || window.location.pathname === '/login') return;
  redirecting = true;
  window.dispatchEvent(new Event('session-expiring'));
  const callbackUrl = window.location.pathname + window.location.search + window.location.hash;
  void signOut({ redirect: false }).finally(() => {
    window.location.assign(`/login?message=session-expired&callbackUrl=${encodeURIComponent(callbackUrl)}`);
  });
}

export async function renewedToken(previous: string | null) {
  const session = await getSession();
  if (session?.error === 'RefreshUnavailable') return null;
  if (session?.accessToken && !session.error && `Bearer ${session.accessToken}` !== previous) {
    return session.accessToken;
  }
  expireSession();
  return null;
}
