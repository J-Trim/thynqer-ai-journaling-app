import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomPromptForm } from "./CustomPromptForm";
import { Database } from "@/integrations/supabase/types";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface TransformationDialogProps {
  group: string;
  items: string[];
  selectedType: string;
  onTypeChange: (value: ValidTransformation) => void;
  customPrompts: Array<{ prompt_name: string; prompt_template: string; }>;
  onPromptSave: () => void;
}

export const TransformationDialog = ({
  group,
  items,
  selectedType,
  onTypeChange,
  customPrompts,
  onPromptSave
}: TransformationDialogProps) => {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogTitle className="text-lg font-semibold">{group}</DialogTitle>
      <div className="space-y-4 pt-4">
        {group === "Custom" ? (
          <div className="space-y-4">
            <CustomPromptForm onPromptSave={onPromptSave} />
            {customPrompts.length > 0 && (
              <Select value={selectedType} onValueChange={(value: ValidTransformation) => onTypeChange(value)}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Choose Custom Prompt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {customPrompts.map((prompt) => (
                      <SelectItem key={prompt.prompt_name} value={prompt.prompt_name}>
                        {prompt.prompt_name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>
        ) : (
          <Select value={selectedType} onValueChange={(value: ValidTransformation) => onTypeChange(value)}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder={`Choose ${group} Type`} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {items.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>
    </DialogContent>
  );
};