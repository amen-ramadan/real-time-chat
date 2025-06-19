type Props = {
  message?: string;
};

export default function ErrorMessage({ message }: Props) {
  if (!message) return null;
  return <p className="text-red-500 text-sm -mt-2 mb-2">{message}</p>;
}
