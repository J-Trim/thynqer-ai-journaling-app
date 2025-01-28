import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomPromptForm } from "./CustomPromptForm";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Car, Bot, Loader2 } from "lucide-react";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface TransformationDialogProps {
  group: string;
  items: string[];
  selectedType: string;
  onTypeChange: (value: ValidTransformation) => void;
  customPrompts: Array<{ prompt_name: string; prompt_template: string; }>;
  onPromptSave: () => void;
  onTransform: () => void;
  isTransforming: boolean;
  isSaving: boolean;
}

export const TransformationDialog = ({
  group,
  items,
  selectedType,
  onTypeChange,
  customPrompts,
  onPromptSave,
  onTransform,
  isTransforming,
  isSaving
}: TransformationDialogProps) => {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogTitle className="text-lg font-semibold">{group}</DialogTitle>
      <div className="space-y-4 pt-4">
        {group === "Custom" ? (
          <div className="space-y-4">
            <CustomPromptForm onPromptSave={onPromptSave} />
            {customPrompts.length > 0 && (
              <div className="space-y-4">
                <Select value={selectedType} onValueChange={(value: ValidTransformation) => onTypeChange(value)}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Choose Custom Prompt" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    <SelectGroup>
                      {customPrompts.map((prompt) => (
                        <SelectItem key={prompt.prompt_name} value={prompt.prompt_name}>
                          {prompt.prompt_name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {selectedType && (
                  <Button 
                    onClick={onTransform} 
                    disabled={isTransforming || !selectedType || isSaving}
                    size="sm"
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
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Select value={selectedType} onValueChange={(value: ValidTransformation) => onTypeChange(value)}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder={`Choose ${group} Type`} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                <SelectGroup>
                  {items.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {selectedType && (
              <Button 
                onClick={onTransform} 
                disabled={isTransforming || !selectedType || isSaving}
                size="sm"
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
            )}
          </div>
        )}
      </div>
    </DialogContent>
  );
};