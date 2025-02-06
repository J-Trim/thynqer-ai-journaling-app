import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ReactNode } from "react";

interface TransformationDialogProps {
  group: string;
  items: string[];
  children: ReactNode;
}

export const TransformationDialog = ({
  group,
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