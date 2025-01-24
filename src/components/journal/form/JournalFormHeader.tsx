import { Input } from "@/components/ui/input";
import AudioRecorderControls from "@/components/journal/audio/AudioRecorderControls";

interface JournalFormHeaderProps {
  title: string;
  onTitleChange: (value: string) => void;
  isRecording?: boolean;
  isPaused?: boolean;
  isProcessing?: boolean;
  onToggleRecording?: () => void;
  onStopRecording?: () => void;
}

const JournalFormHeader = ({ 
  title, 
  onTitleChange,
  isRecording = false,
  isPaused = false,
  isProcessing = false,
  onToggleRecording = () => {},
  onStopRecording = () => {}
}: JournalFormHeaderProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold">Journal Entry</h2>
        <p className="text-muted-foreground">Capture your thoughts with text and voice</p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-2xl font-semibold"
        />
        <div className="flex-shrink-0">
          <AudioRecorderControls
            isRecording={isRecording}
            isPaused={isPaused}
            isProcessing={isProcessing}
            onToggleRecording={onToggleRecording}
            onStopRecording={onStopRecording}
          />
        </div>
      </div>
    </div>
  );
};

export default JournalFormHeader;