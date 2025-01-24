import { Button } from "@/components/ui/button";

interface JournalFormActionsProps {
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  isTranscriptionPending: boolean;
}

const JournalFormActions = ({ 
  onCancel, 
  onSave, 
  isSaving,
  isTranscriptionPending 
}: JournalFormActionsProps) => {
  return (
    <div className="flex justify-end space-x-4">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isSaving || isTranscriptionPending}
      >
        Cancel
      </Button>
      <Button
        onClick={onSave}
        disabled={isSaving || isTranscriptionPending}
      >
        {isSaving ? "Saving..." : "Save Entry"}
      </Button>
    </div>
  );
};

export default JournalFormActions;