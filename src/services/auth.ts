import AsyncStorage from '@react-native-async-storage/async-storage';

export const ACCESS_TOKEN_STORAGE_KEY = 'access_token';

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let isHandlingUnauthorized = false;

export class AuthenticationRequiredError extends Error {
  constructor() {
    super('Authentication required');
    this.name = 'AuthenticationRequiredError';
  }
}

export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null) => {
  unauthorizedHandler = handler;
};

export const storeAccessToken = async (accessToken: string) => {
  await AsyncStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken.trim());
};

export const clearSession = async () => {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_STORAGE_KEY, 'user']);
};

const handleUnauthorized = async () => {
  if (isHandlingUnauthorized) {
    return;
  }

  isHandlingUnauthorized = true;
  try {
    await clearSession();
    unauthorizedHandler?.();
  } finally {
    setTimeout(() => {
      isHandlingUnauthorized = false;
    }, 500);
  }
};

export const authenticatedFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> => {
  const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

  if (!accessToken) {
    await handleUnauthorized();
    throw new AuthenticationRequiredError();
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    await handleUnauthorized();
    throw new AuthenticationRequiredError();
  }

  return response;
};

export const isAuthenticationRequiredError = (
  error: unknown
): error is AuthenticationRequiredError => error instanceof AuthenticationRequiredError;
