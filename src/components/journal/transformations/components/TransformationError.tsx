interface TransformationErrorProps {
  error: string | null;
}

export const TransformationError = ({ error }: TransformationErrorProps) => {
  if (!error) return null;

  return (
    <div 
      role="alert" 
      className="text-destructive bg-destructive/10 p-4 rounded-md"
      aria-live="polite"
    >
      {error}
    </div>
  );
};