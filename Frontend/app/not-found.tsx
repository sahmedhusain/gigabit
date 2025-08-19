import ErrorPage from '@/components/ErrorPage';

export default function NotFound() {
  return (
    <ErrorPage
      errorCode={404}
      title="Page Not Found"
      message="The page you're looking for doesn't exist or has been moved."
      showBackButton={true}
      showHomeButton={true}
    />
  );
}
