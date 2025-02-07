
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
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Button
          size="icon"
          onClick={onToggleRecording}
          disabled={isProcessing}
          variant="ghost"
          className={`h-12 w-12 rounded-full hover:bg-secondary/80 relative z-10 ${
            isRecording 
              ? isPaused
                ? "text-primary hover:text-primary-hover"
                : "text-accent hover:text-accent-hover"
              : "text-primary hover:text-primary-hover"
          }`}
        >
          {isRecording && !isPaused ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
        {isRecording && !isPaused && (
          <div className="absolute inset-0 animate-pulse bg-accent/20 rounded-full" />
        )}
      </div>
      {isRecording && (
        <Button
          size="icon"
          onClick={onStopRecording}
          disabled={isProcessing}
          variant="ghost"
          className="h-10 w-10 rounded-full text-green-600 hover:text-green-700 hover:bg-secondary/80"
        >
          <Save className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default AudioRecorderControls;
