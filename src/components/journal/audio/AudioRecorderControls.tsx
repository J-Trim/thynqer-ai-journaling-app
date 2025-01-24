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
    <div className="flex space-x-4">
      <Button
        onClick={onToggleRecording}
        disabled={isProcessing}
        className={`${
          isRecording 
            ? isPaused
              ? "bg-primary hover:bg-primary-hover text-white"
              : "bg-accent hover:bg-accent-hover text-text"
            : "bg-primary hover:bg-primary-hover text-white"
        }`}
      >
        {isRecording && !isPaused ? (
          <Pause className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </Button>
      {isRecording && (
        <Button
          onClick={onStopRecording}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Save className="w-6 h-6 mr-2" />
          Save & Transcribe
        </Button>
      )}
    </div>
  );
};

export default AudioRecorderControls;