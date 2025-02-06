import { Bot, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TransformationError } from "./TransformationError";

interface TransformationResultProps {
  error: string | null;
  errorType?: 'network' | 'validation' | 'server' | 'general';
  lastTransformation: string | null;
  lastTransformationType: string | null;
  isLoading?: boolean;
}

export const TransformationResult = ({
  error,
  errorType,
  lastTransformation,
  lastTransformationType,
  isLoading
}: TransformationResultProps) => {
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <TransformationError error={error} type={errorType} />
      )}

      {lastTransformation && lastTransformationType && (
        <Card className="w-full mt-4 animate-in fade-in-50 slide-in-from-bottom-5">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Bot className="h-4 w-4 text-primary" />
            <h4 className="font-medium">{lastTransformationType}</h4>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">
              {lastTransformation}
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
};