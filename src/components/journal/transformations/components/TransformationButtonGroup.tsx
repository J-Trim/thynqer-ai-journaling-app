import { memo } from "react";
import { TransformationButton } from "../TransformationButton";
import { TRANSFORMATION_TYPES } from "@/utils/transformationTypes";

interface TransformationButtonGroupProps {
  isDialogOpen: boolean;
  activeGroup: string | null;
  onOpenChange: (open: boolean, group: string) => void;
  children: React.ReactNode;
}

const TransformationButtonGroup = memo(({
  isDialogOpen,
  activeGroup,
  onOpenChange,
  children
}: TransformationButtonGroupProps) => (
  <div className="flex justify-center gap-8 mb-8">
    {Object.entries(TRANSFORMATION_TYPES).map(([group, { icon: Icon }]) => (
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
));

TransformationButtonGroup.displayName = "TransformationButtonGroup";
export default TransformationButtonGroup;