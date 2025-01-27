import { Button } from "@/components/ui/button";
import { Loader2, Car, Bot } from "lucide-react";

interface TransformationResultProps {
  error: string | null;
  isTransforming: boolean;
  isSaving: boolean;
  selectedType: string;
  onTransform: () => void;
  lastTransformation: string | null;
  lastTransformationType: string | null;
}

export const TransformationResult = ({
  error,
  isTransforming,
  isSaving,
  selectedType,
  onTransform,
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

      <Button 
        onClick={onTransform} 
        disabled={isTransforming || !selectedType || isSaving}
        className="w-full"
      >
        {isTransforming || isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isSaving ? 'Saving entry...' : 'Transforming...'}
          </>
        ) : (
          <>
            <Car className="mr-2 h-4 w-4" />
            Transform
            <Bot className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      {lastTransformation && lastTransformationType && (
        <div className="w-full border rounded-lg p-4 mt-4 animate-fade-in">
          <h4 className="font-medium mb-2">{lastTransformationType}</h4>
          <p className="whitespace-pre-wrap text-sm">
            {lastTransformation}
          </p>
        </div>
      )}
    </>
  );
};