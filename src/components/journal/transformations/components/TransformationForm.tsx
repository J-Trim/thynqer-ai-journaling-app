import React, { memo } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";
import { TRANSFORMATION_TYPES } from "@/utils/transformationTypes";

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

export const TransformationForm = memo(({
  selectedType,
  onTypeChange,
  onTransform,
  isTransforming,
  isSaving,
  customPrompts,
  activeGroup
}: TransformationFormProps) => {
  console.log('Rendering TransformationForm with activeGroup:', activeGroup);
  console.log('Current transformation types:', TRANSFORMATION_TYPES[activeGroup || ""]?.items || []);

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

  return (
    <div className="space-y-4">
      <Select value={selectedType} onValueChange={(value: ValidTransformation) => onTypeChange(value)}>
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
});

TransformationForm.displayName = 'TransformationForm';

export default TransformationForm;