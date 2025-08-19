import ErrorPage from '@/components/ErrorPage';

export default function InternalServerError() {
  return (
    <ErrorPage
      errorCode={500}
      title="Internal Server Error"
      message="Something went wrong on our servers. Please try again later."
      showBackButton={true}
      showHomeButton={true}
    />
  );
}
