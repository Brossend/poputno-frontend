export const useApiClient = () => {
  const config = useRuntimeConfig();
  const apiBaseUrl = String(config.public.apiBaseUrl).replace(/\/$/, '');

  const apiFetch = $fetch.create({
    baseURL: `${apiBaseUrl}/api/v1`,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    onRequest({ options }) {
      if (import.meta.server) {
        const requestHeaders = useRequestHeaders(['cookie']);
        const headers = new Headers(options.headers);

        if (requestHeaders.cookie) {
          headers.set('cookie', requestHeaders.cookie);
        }

        options.headers = headers;
      }
    },
  });

  return {
    apiFetch,
  };
};
