import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Database } from "@/integrations/supabase/types";
import { ReactNode } from "react";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface TransformationDialogProps {
  group: string;
  items: ValidTransformation[];
  selectedType: ValidTransformation | "";
  onTypeChange?: (type: ValidTransformation | "") => void;
  customPrompts?: Array<{ prompt_name: string; prompt_template: string }>;
  onPromptSave?: () => void;
  onTransform?: () => void;
  isTransforming?: boolean;
  isSaving?: boolean;
  children?: ReactNode;
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
  isSaving,
  children
}: TransformationDialogProps) => {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogTitle className="text-lg font-semibold">{group}</DialogTitle>
      <div className="space-y-4 pt-4">
        {children}
      </div>
    </DialogContent>
  );
};