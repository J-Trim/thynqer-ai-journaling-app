import { TransformationButton } from "./TransformationButton";
import { TRANSFORMATION_TYPES } from "@/utils/transformationTypes";

interface TransformationButtonsProps {
  isDialogOpen: boolean;
  activeGroup: string | null;
  onOpenChange: (open: boolean, group: string) => void;
  children: React.ReactNode;
}

export const TransformationButtons = ({
  isDialogOpen,
  activeGroup,
  onOpenChange,
  children
}: TransformationButtonsProps) => {
  return (
    <div className="flex justify-center gap-8 mb-8">
      {Object.entries(TRANSFORMATION_TYPES).map(([group, { icon: Icon, items }]) => (
        <TransformationButton
          key={group}
          group={group}
          Icon={Icon}
          isDialogOpen={isDialogOpen && activeGroup === group}
          onOpenChange={(open) => onOpenChange(open, group)}
        >
          {children}
        </TransformationButton>
      ))}
    </div>
  );
};