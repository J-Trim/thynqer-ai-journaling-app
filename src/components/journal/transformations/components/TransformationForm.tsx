import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface TransformationFormProps {
  selectedType: ValidTransformation | "";
  onTypeChange: (type: ValidTransformation | "") => void;
  onTransform: () => void;
  isTransforming: boolean;
  isSaving: boolean;
  customPrompts: Array<{ prompt_name: string; prompt_template: string; }>;
  activeGroup: string | null;
}

export const TransformationForm = ({
  selectedType,
  onTypeChange,
  onTransform,
  isTransforming,
  isSaving,
  customPrompts,
  activeGroup
}: TransformationFormProps) => {
  return (
    <div className="space-y-4">
      <Select value={selectedType} onValueChange={(value: ValidTransformation) => onTypeChange(value)}>
        <SelectTrigger className="w-full bg-background">
          <SelectValue placeholder={`Choose ${activeGroup} Type`} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] overflow-y-auto">
          <SelectGroup>
            {activeGroup === "Custom" 
              ? customPrompts.map((prompt) => (
                  <SelectItem key={prompt.prompt_name} value={prompt.prompt_name}>
                    {prompt.prompt_name}
                  </SelectItem>
                ))
              : []
            }
          </SelectGroup>
        </SelectContent>
      </Select>

      {selectedType && (
        <Button 
          onClick={onTransform} 
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