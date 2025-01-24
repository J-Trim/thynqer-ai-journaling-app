import { Button } from "@/components/ui/button";
import { Mic, Pause, Save } from "lucide-react";

interface AudioRecorderControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  onToggleRecording: () => void;
  onStopRecording: () => void;
}

const AudioRecorderControls = ({
  isRecording,
  isPaused,
  isProcessing,
  onToggleRecording,
  onStopRecording
}: AudioRecorderControlsProps) => {
  return (
    <div className="flex gap-1">
      <Button
        size="icon"
        onClick={onToggleRecording}
        disabled={isProcessing}
        variant="ghost"
        className={`h-8 w-8 rounded-full hover:bg-secondary/80 ${
          isRecording 
            ? isPaused
              ? "text-primary hover:text-primary-hover"
              : "text-accent hover:text-accent-hover"
            : "text-primary hover:text-primary-hover"
        }`}
      >
        {isRecording && !isPaused ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      {isRecording && (
        <Button
          size="icon"
          onClick={onStopRecording}
          disabled={isProcessing}
          variant="ghost"
          className="h-8 w-8 rounded-full text-green-600 hover:text-green-700 hover:bg-secondary/80"
        >
          <Save className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default AudioRecorderControls;