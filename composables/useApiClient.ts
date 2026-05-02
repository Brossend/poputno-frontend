import { appendResponseHeader } from 'h3';

const collectSetCookies = (headers: Headers): string[] => {
  const cookieHeaders = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.();

  if (cookieHeaders?.length) {
    return cookieHeaders;
  }

  const fallback = headers.get('set-cookie');

  return fallback ? [fallback] : [];
};

const mergeCookieHeader = (currentCookieHeader: string | undefined, setCookies: string[]): string | undefined => {
  const cookieMap = new Map<string, string>();

  for (const chunk of currentCookieHeader?.split(';') ?? []) {
    const [rawName, ...rawValue] = chunk.trim().split('=');

    if (!rawName || rawValue.length === 0) {
      continue;
    }

    cookieMap.set(rawName, rawValue.join('='));
  }

  for (const setCookie of setCookies) {
    const [pair] = setCookie.split(';');

    if (!pair) {
      continue;
    }

    const [rawName, ...rawValue] = pair.trim().split('=');

    if (!rawName || rawValue.length === 0) {
      continue;
    }

    cookieMap.set(rawName, rawValue.join('='));
  }

  if (cookieMap.size === 0) {
    return currentCookieHeader;
  }

  return Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
};

export const useApiClient = () => {
  const config = useRuntimeConfig();
  const apiBaseUrl = String(config.public.apiBaseUrl).replace(/\/$/, '');
  const requestEvent = import.meta.server ? useRequestEvent() : null;
  let requestCookie = import.meta.server ? useRequestHeaders(['cookie']).cookie : undefined;

  const syncResponseCookies = (headers: Headers) => {
    if (!requestEvent) {
      return;
    }

    const setCookies = collectSetCookies(headers);

    if (setCookies.length === 0) {
      return;
    }

    for (const cookie of setCookies) {
      appendResponseHeader(requestEvent, 'set-cookie', cookie);
    }

    requestCookie = mergeCookieHeader(requestCookie, setCookies);
  };

  const apiFetch = $fetch.create({
    baseURL: `${apiBaseUrl}/api/v1`,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    onRequest({ options }) {
      if (!requestCookie) {
        return;
      }

      const headers = new Headers(options.headers);
      headers.set('cookie', requestCookie);
      options.headers = headers;
    },
    onResponse({ response }) {
      syncResponseCookies(response.headers);
    },
    onResponseError({ response }) {
      syncResponseCookies(response.headers);
    },
  });

  return {
    apiFetch,
  };
};
