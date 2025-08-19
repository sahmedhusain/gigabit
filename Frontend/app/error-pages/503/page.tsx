import ErrorPage from '@/components/ErrorPage';

export default function ServiceUnavailable() {
  return (
    <ErrorPage
      errorCode={503}
      title="Service Unavailable"
      message="The service is temporarily unavailable. Please try again in a few minutes."
      showBackButton={true}
      showHomeButton={true}
    />
  );
}
