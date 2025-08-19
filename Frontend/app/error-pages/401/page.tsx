import ErrorPage from '@/components/ErrorPage';

export default function Unauthorized() {
  return (
    <ErrorPage
      errorCode={401}
      title="Unauthorized"
      message="You need to log in to access this page."
      showBackButton={true}
      showHomeButton={true}
    />
  );
}
