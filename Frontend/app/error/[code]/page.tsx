'use client';

import { useParams, useSearchParams } from 'next/navigation';
import ErrorPage from '@/components/ErrorPage';

export default function DynamicErrorPage() {
  const params = useParams()
  const searchParams = useSearchParams();

  const errorCode = parseInt((params as { code: string }).code) || 500;
  const title = searchParams?.get('title') || undefined;
  const message = searchParams?.get('message') || undefined;

  return (
    <ErrorPage
      errorCode={errorCode}
      title={title}
      message={message}
      showBackButton={true}
      showHomeButton={true}
    />
  );
}