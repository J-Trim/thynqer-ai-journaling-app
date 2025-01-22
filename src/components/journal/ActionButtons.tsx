import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
}

const ActionButtons = ({ onCancel, onSave, isSaving }: ActionButtonsProps) => {
  return (
    <div className="flex justify-end space-x-4">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isSaving}
      >
        Cancel
      </Button>
      <Button
        onClick={onSave}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save Entry"}
      </Button>
    </div>
  );
};

export default ActionButtons;