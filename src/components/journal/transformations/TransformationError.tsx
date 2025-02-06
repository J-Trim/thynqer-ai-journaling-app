import { AlertCircle, XCircle, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TransformationErrorProps {
  error: string | null;
  type?: 'network' | 'validation' | 'server' | 'general';
}

export const TransformationError = ({ error, type = 'general' }: TransformationErrorProps) => {
  if (!error) return null;

  const getErrorIcon = () => {
    switch (type) {
      case 'network':
        return <WifiOff className="h-4 w-4" />;
      case 'validation':
        return <AlertCircle className="h-4 w-4" />;
      case 'server':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getErrorTitle = () => {
    switch (type) {
      case 'network':
        return 'Connection Error';
      case 'validation':
        return 'Invalid Input';
      case 'server':
        return 'Server Error';
      default:
        return 'Error';
    }
  };

  return (
    <Alert variant="destructive" className="animate-in fade-in-50">
      <div className="flex items-center gap-2">
        {getErrorIcon()}
        <AlertTitle>{getErrorTitle()}</AlertTitle>
      </div>
      <AlertDescription className="mt-2">
        {error}
      </AlertDescription>
    </Alert>
  );
};