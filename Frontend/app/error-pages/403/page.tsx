import ErrorPage from '@/components/ErrorPage';

export default function Forbidden() {
  return (
    <ErrorPage
      errorCode={403}
      title="Forbidden"
      message="You don't have permission to access this resource."
      showBackButton={true}
      showHomeButton={true}
    />
  );
}
