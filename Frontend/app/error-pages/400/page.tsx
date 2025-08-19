import ErrorPage from '@/components/ErrorPage';

export default function BadRequest() {
  return (
    <ErrorPage
      errorCode={400}
      title="Bad Request"
      message="The request could not be processed due to invalid data or parameters."
      showBackButton={true}
      showHomeButton={true}
    />
  );
}
