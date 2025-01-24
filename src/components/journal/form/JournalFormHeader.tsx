import { Input } from "@/components/ui/input";
import AudioRecorderTimer from "@/components/journal/audio/AudioRecorderTimer";
import AudioRecorderControls from "@/components/journal/audio/AudioRecorderControls";

interface JournalFormHeaderProps {
  title: string;
  onTitleChange: (value: string) => void;
  isRecording?: boolean;
  isPaused?: boolean;
  isProcessing?: boolean;
  recordingTime?: number;
  onToggleRecording?: () => void;
  onStopRecording?: () => void;
}

const JournalFormHeader = ({ 
  title, 
  onTitleChange,
  isRecording = false,
  isPaused = false,
  isProcessing = false,
  recordingTime = 0,
  onToggleRecording = () => {},
  onStopRecording = () => {}
}: JournalFormHeaderProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold">Journal Entry</h2>
        <p className="text-muted-foreground">Capture your thoughts with text and voice</p>
      </div>
      <div className="flex items-center gap-4">
        <Input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-2xl font-semibold"
        />
        <div className="flex items-center gap-2 min-w-fit">
          <div className="text-lg font-semibold text-muted-foreground">
            {recordingTime > 0 && <AudioRecorderTimer recordingTime={recordingTime} />}
          </div>
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