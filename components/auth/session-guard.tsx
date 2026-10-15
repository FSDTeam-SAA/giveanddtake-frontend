'use client';
import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { expireSession, renewedToken } from '@/lib/session-recovery';

export function SessionGuard() {
  const { data: session, status } = useSession();
  const lastDeadline = useRef<number>();
  useEffect(() => {
    if (session?.sessionExpiresAt) lastDeadline.current = session.sessionExpiresAt;
    if (session?.error === 'SessionExpired' ||
        (status === 'unauthenticated' && !!lastDeadline.current && Date.now() >= lastDeadline.current)) expireSession();
    if (!session?.sessionExpiresAt) return;
    const check = () => { if (Date.now() >= session.sessionExpiresAt!) expireSession(); };
    check();
    const timer = window.setInterval(check, 30_000);
    return () => window.clearInterval(timer);
  }, [session, status]);

  useEffect(() => {
    const nativeFetch = window.fetch;
    const apiBase = process.env.NEXT_PUBLIC_BASE_URL;
    const isApi = (url: string) => !!apiBase && (url === apiBase || url.startsWith(apiBase.replace(/\/$/, '') + '/'));
    window.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (!isApi(url)) return nativeFetch(input, init);
      const request = new Request(input, init);
      const retry = request.clone();
      const response = await nativeFetch(request);
      if (response.status !== 401 || !request.headers.has('Authorization')) return response;
      const token = await renewedToken(request.headers.get('Authorization'));
      if (!token) return response;
      retry.headers.set('Authorization', `Bearer ${token}`);
      const retried = await nativeFetch(retry);
      if (retried.status === 401) expireSession();
      return retried;
    };
    const interceptor = axios.interceptors.response.use(value => value, async error => {
      const config = error.config;
      if (error.response?.status === 401 && config && isApi(String(config.url)) &&
          config.headers?.Authorization && !config._sessionRetried) {
        const token = await renewedToken(String(config.headers.Authorization));
        if (token) {
          config._sessionRetried = true;
          config.headers.Authorization = `Bearer ${token}`;
          return axios(config);
        }
      }
      if (error.response?.status === 401 && config?._sessionRetried) expireSession();
      return Promise.reject(error);
    });
    return () => { window.fetch = nativeFetch; axios.interceptors.response.eject(interceptor); };
  }, []);
  return null;
}
