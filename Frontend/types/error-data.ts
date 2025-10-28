
export interface APIError {
  error: string;
  code?: string;
  details?: unknown;
  status?: number;
}

export class NetworkError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message)
    this.name = 'AuthenticationError'
  }
}