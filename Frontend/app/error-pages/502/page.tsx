import ErrorPage from '@/components/ErrorPage';

export default function BadGateway() {
  return (
    <ErrorPage
      errorCode={502}
      title="Bad Gateway"
      message="The server received an invalid response. Please try again later."
      showBackButton={true}
      showHomeButton={true}
    />
  );
}
