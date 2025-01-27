import { Bot } from "lucide-react";

interface TransformationResultProps {
  error: string | null;
  lastTransformation: string | null;
  lastTransformationType: string | null;
}

export const TransformationResult = ({
  error,
  lastTransformation,
  lastTransformationType
}: TransformationResultProps) => {
  return (
    <>
      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}

      {lastTransformation && lastTransformationType && (
        <div className="w-full border rounded-lg p-4 mt-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="h-4 w-4" />
            <h4 className="font-medium">{lastTransformationType}</h4>
          </div>
          <p className="whitespace-pre-wrap text-sm">
            {lastTransformation}
          </p>
        </div>
      )}
    </>
  );
};