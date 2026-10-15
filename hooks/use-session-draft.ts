'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FieldValues, UseFormReturn, useWatch } from 'react-hook-form';

export const draftKey = (owner: string, name: string) => `evpitch:draft:${owner}:${name}`;
export function useSessionDraft<T>(name: string, value: T, restore: (saved: T) => void) {
  const { data: session } = useSession();
  const owner = session?.user?.id;
  const [readyOwner, setReadyOwner] = useState<string>();
  const restoreRef = useRef(restore);
  restoreRef.current = restore;
  const cleared = useRef(false);
  useEffect(() => {
    if (!owner) return;
    cleared.current = false;
    try {
      const raw = sessionStorage.getItem(draftKey(owner, name));
      const saved = raw ? JSON.parse(raw) : null;
      if (saved && Date.now() - saved.time < 24 * 60 * 60 * 1000) restoreRef.current(saved.value);
    } catch { /* Draft storage is optional. */ }
    setReadyOwner(owner);
  }, [owner, name]);
  useEffect(() => {
    if (!owner || readyOwner !== owner || cleared.current) return;
    const save = () => {
      try { sessionStorage.setItem(draftKey(owner, name), JSON.stringify({ time: Date.now(), value })); }
      catch { /* A full or unavailable storage must not block editing. */ }
    };
    save();
    window.addEventListener('session-expiring', save);
    return () => window.removeEventListener('session-expiring', save);
  }, [owner, readyOwner, name, value]);
  return useCallback(() => {
    cleared.current = true;
    if (owner) { try { sessionStorage.removeItem(draftKey(owner, name)); } catch {} }
  }, [owner, name]);
}

export function useFormDraft<T extends FieldValues>(name: string, form: UseFormReturn<T>, onRestore?: (value: T) => void) {
  const values = useWatch({ control: form.control }) as T;
  return useSessionDraft(name, values, value => { form.reset(value); onRestore?.(value); });
}
