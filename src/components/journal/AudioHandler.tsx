
import { useCallback } from "react";
import AudioRecorder from "@/components/AudioRecorder";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TransformationError } from "./transformations/TransformationError";
import { useTranscriptionPolling } from "@/hooks/useTranscriptionPolling";

interface AudioHandlerProps {
  onAudioSaved: (audioUrl: string) => void;
  onTranscriptionComplete: (text: string) => void;
  isRecording?: boolean;
  isPaused?: boolean;
  isProcessing?: boolean;
  onToggleRecording?: () => void;
  onStopRecording?: () => void;
  isExistingEntry?: boolean;
}

const AudioHandler = ({ 
  onAudioSaved, 
  onTranscriptionComplete,
  isRecording,
  isPaused,
  isProcessing,
  onToggleRecording,
  onStopRecording,
  isExistingEntry = false
}: AudioHandlerProps) => {
  const {
    isTranscribing,
    progress,
    error,
    errorType,
    startTranscription
  } = useTranscriptionPolling(onTranscriptionComplete);

  const handleAudioSaved = useCallback(async (audioFileName: string) => {
    onAudioSaved(audioFileName);
    await startTranscription(audioFileName);
  }, [onAudioSaved, startTranscription]);

  const recorder = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={isExistingEntry ? "opacity-50 cursor-not-allowed" : ""}>
            <AudioRecorder 
              onAudioSaved={handleAudioSaved}
              isRecording={isRecording}
              isPaused={isPaused}
              isProcessing={isProcessing}
              onToggleRecording={isExistingEntry ? undefined : onToggleRecording}
              onStopRecording={isExistingEntry ? undefined : onStopRecording}
              isDisabled={isExistingEntry}
            />
          </div>
        </TooltipTrigger>
        {isExistingEntry && (
          <TooltipContent>
            <p>Audio recording is only available when creating a new entry</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div 
      className="relative"
      role="region"
      aria-label="Audio recording controls"
    >
      {error && (
        <TransformationError 
          error={error} 
          type={errorType || 'general'} 
        />
      )}
      {recorder}
      {isTranscribing && (
        <div 
          className="mt-4 space-y-2"
          role="status"
          aria-label="Transcribing audio"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Transcribing audio... {progress}%</span>
          </div>
          <Progress value={progress} className="h-2 w-full" />
        </div>
      )}
    </div>
  );
};

export default AudioHandler;
