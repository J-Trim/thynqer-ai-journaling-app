
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SaveControlsProps {
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  isTranscriptionPending: boolean;
}

const SaveControls = ({
  onCancel,
  onSave,
  isSaving,
  isTranscriptionPending
}: SaveControlsProps) => {
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
        {isSaving && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {isSaving ? "Saving..." : "Save Entry"}
      </Button>
    </div>
  );
};

export default SaveControls;
