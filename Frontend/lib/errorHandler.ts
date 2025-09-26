export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

type ErrorResponseData = { error?: string; code?: string; [key: string]: unknown };

interface AxiosLikeError {
  response?: { status?: number; data?: ErrorResponseData };
  request?: unknown;
  message?: string;
}

function isAxiosLikeError(err: unknown): err is AxiosLikeError {
  return typeof err === 'object' && err !== null && (
    'response' in (err as Record<string, unknown>) ||
    'request' in (err as Record<string, unknown>) ||
    'message' in (err as Record<string, unknown>)
  );
}

export class ApiErrorHandler {
  static handleError(error: unknown): void {
    if (isAxiosLikeError(error) && error.response) {
      const status = error.response.status ?? 0;
      const message = error.response.data?.error || error.message || 'An unexpected error occurred';
      const code = error.response.data?.code;

      const apiError: ApiError = { status, message, code };
      
      console.error('API Error:', apiError);
      
      // Handle specific error cases
      switch (status) {
        case 400:
          window.location.href = '/error/400';
          break;
        case 401:
          // Token expiration is handled in api.ts
          if (code !== 'TOKEN_EXPIRED' && code !== 'SESSION_EXPIRED') {
            window.location.href = '/error/401';
          }
          break;
        case 403:
          window.location.href = '/error/403';
          break;
        case 404:
          window.location.href = '/not-found';
          break;
        case 500:
          window.location.href = '/error/500';
          break;
        case 502:
          window.location.href = '/error/502';
          break;
        case 503:
          window.location.href = '/error/503';
          break;
        default:
          console.error('Unhandled API error:', apiError);
      }
    } else if (isAxiosLikeError(error) && error.request) {
      // Network error
      console.error('Network error:', error.request);
      window.location.href = '/error/503';
    } else {
      // Something else happened
      const msg = isAxiosLikeError(error) ? error.message : (error instanceof Error ? error.message : String(error));
      console.error('Unexpected error:', msg);
      window.location.href = '/error/500';
    }
  }
  static isAuthError(error: unknown): boolean {
    if (!isAxiosLikeError(error)) return false;
    return error.response?.status === 401 ||
      error.response?.data?.code === 'TOKEN_EXPIRED' ||
      error.response?.data?.code === 'SESSION_EXPIRED';
  }

  static getErrorMessage(error: unknown): string {
    if (isAxiosLikeError(error) && error.response?.data?.error) {
      return error.response.data.error as string;
    }
    if (isAxiosLikeError(error) && error.message) {
      return error.message;
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}

export default ApiErrorHandler;
