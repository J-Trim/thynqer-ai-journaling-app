
import { memo } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";
import { TRANSFORMATION_TYPES } from "@/utils/transformationTypes";
import { ErrorBoundary } from 'react-error-boundary';

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface TransformationFormProps {
  selectedType: ValidTransformation | "";
  onTypeChange: (type: ValidTransformation | "") => void;
  onTransform: (type: ValidTransformation) => Promise<boolean>;
  isTransforming: boolean;
  isSaving: boolean;
  customPrompts: Array<{ prompt_name: string; prompt_template: string; }>;
  activeGroup: string | null;
}

const TransformationFormContent = ({
  selectedType,
  onTypeChange,
  onTransform,
  isTransforming,
  isSaving,
  customPrompts,
  activeGroup
}: TransformationFormProps) => {
  console.log('Rendering TransformationForm with activeGroup:', activeGroup);
  console.log('Current transformation types:', activeGroup ? TRANSFORMATION_TYPES[activeGroup]?.items || [] : []);

  const handleTransform = () => {
    if (selectedType) {
      onTransform(selectedType);
    }
  };

  const getTransformationItems = () => {
    if (activeGroup === "Custom") {
      return customPrompts.map(prompt => ({
        value: prompt.prompt_name,
        label: prompt.prompt_name
      }));
    }
    
    return (TRANSFORMATION_TYPES[activeGroup || ""]?.items || []).map(item => ({
      value: item,
      label: item
    }));
  };

  const items = getTransformationItems();
  console.log('Available transformation items:', items);

  if (!activeGroup) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Select 
        value={selectedType} 
        onValueChange={(value: ValidTransformation) => onTypeChange(value)}
      >
        <SelectTrigger className="w-full bg-background">
          <SelectValue placeholder={`Choose ${activeGroup} Type`} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] overflow-y-auto">
          <SelectGroup>
            {items.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {selectedType && (
        <Button 
          onClick={handleTransform} 
          disabled={isTransforming || !selectedType || isSaving}
          className="w-full"
          aria-label={isTransforming ? "Transforming..." : "Transform text"}
        >
          {isTransforming || isSaving ? "Processing..." : "Transform"}
        </Button>
      )}
    </div>
  );
};

export const TransformationForm = memo((props: TransformationFormProps) => {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong with the transformation form.</div>}
      onError={(error) => {
        console.error('TransformationForm Error:', error);
      }}
    >
      <TransformationFormContent {...props} />
    </ErrorBoundary>
  );
});

TransformationForm.displayName = 'TransformationForm';

export default TransformationForm;
