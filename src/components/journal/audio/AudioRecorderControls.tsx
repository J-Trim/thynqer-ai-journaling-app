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
    <div className="fixed top-4 right-4 flex gap-2 z-50">
      <Button
        size="icon"
        onClick={onToggleRecording}
        disabled={isProcessing}
        variant="ghost"
        className={`rounded-full hover:bg-secondary/80 ${
          isRecording 
            ? isPaused
              ? "text-primary hover:text-primary-hover"
              : "text-accent hover:text-accent-hover"
            : "text-primary hover:text-primary-hover"
        }`}
      >
        {isRecording && !isPaused ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </Button>
      {isRecording && (
        <Button
          size="icon"
          onClick={onStopRecording}
          disabled={isProcessing}
          variant="ghost"
          className="rounded-full text-green-600 hover:text-green-700 hover:bg-secondary/80"
        >
          <Save className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default AudioRecorderControls;