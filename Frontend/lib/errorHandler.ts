export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

export class ApiErrorHandler {
  static handleError(error: any): void {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error || error.message;
      const code = error.response.data?.code;

      const apiError: ApiError = { status, message, code };
      
      console.error('API Error:', apiError);
      
      // Handle specific error cases
      switch (status) {
        case 400:
          window.location.href = '/error-pages/400';
          break;
        case 401:
          // Token expiration is handled in api.ts
          if (code !== 'TOKEN_EXPIRED' && code !== 'SESSION_EXPIRED') {
            window.location.href = '/error-pages/401';
          }
          break;
        case 403:
          window.location.href = '/error-pages/403';
          break;
        case 404:
          window.location.href = '/not-found';
          break;
        case 500:
          window.location.href = '/error-pages/500';
          break;
        case 502:
          window.location.href = '/error-pages/502';
          break;
        case 503:
          window.location.href = '/error-pages/503';
          break;
        default:
          console.error('Unhandled API error:', apiError);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.request);
      window.location.href = '/error-pages/503';
    } else {
      // Something else happened
      console.error('Unexpected error:', error.message);
      window.location.href = '/error-pages/500';
    }
  }

  static isAuthError(error: any): boolean {
    return error.response?.status === 401 || 
           error.response?.data?.code === 'TOKEN_EXPIRED' ||
           error.response?.data?.code === 'SESSION_EXPIRED';
  }

  static getErrorMessage(error: any): string {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}

export default ApiErrorHandler;
