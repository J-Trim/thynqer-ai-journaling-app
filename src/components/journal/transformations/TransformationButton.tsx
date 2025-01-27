import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface TransformationButtonProps {
  group: string;
  Icon: LucideIcon;
  isDialogOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export const TransformationButton = ({
  group,
  Icon,
  isDialogOpen,
  onOpenChange,
  children
}: TransformationButtonProps) => {
  return (
    <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="lg"
          className="flex flex-col items-center gap-2 p-4 hover:bg-secondary transition-colors"
        >
          <Icon className="h-8 w-8" />
          <span className="text-sm font-medium">{group}</span>
        </Button>
      </DialogTrigger>
      {children}
    </Dialog>
  );
};