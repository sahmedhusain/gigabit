'use client';

import { Component } from 'react';
import ErrorPage from './ErrorPage';
import { ErrorBoundaryProps, ErrorBoundaryState } from '@/types/ui';

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    
    
    this.setState({ error });
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorPage
          errorCode={500}
          title="Application Error"
          message="Something went wrong in the application. Please refresh the page or try again later."
          showBackButton={false}
          showHomeButton={true}
          onRetry={this.retry}
        />
      );
    }

    return this.props.children;
  }
}
