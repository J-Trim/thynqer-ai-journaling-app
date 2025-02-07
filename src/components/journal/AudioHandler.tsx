
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AudioRecorder from "@/components/AudioRecorder";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleAudioSaved = async (audioFileName: string) => {
    try {
      setIsTranscribing(true);
      setProgress(0);
      console.log('Starting audio transcription process for:', audioFileName);
      
      // Save the audio URL first
      onAudioSaved(audioFileName);
      
      // Simulate progress while transcribing
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const nextProgress = Math.min(prev + 10, 90);
          return nextProgress;
        });
      }, 1000);
      
      console.log('Invoking transcribe-audio function...');
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioUrl: audioFileName }
      });

      clearInterval(progressInterval);

      if (error) {
        console.error('Transcription error:', error);
        toast({
          title: "Transcription Failed",
          description: "Could not transcribe audio. Please try again.",
          variant: "destructive",
        });
        throw error;
      }

      if (data?.text) {
        setProgress(100);
        console.log('Transcription completed successfully');
        onTranscriptionComplete(data.text);
        toast({
          title: "Success",
          description: "Audio transcribed successfully",
        });
      } else {
        console.error('No transcription text received');
        toast({
          title: "Error",
          description: "No transcription text received",
          variant: "destructive",
        });
        throw new Error('No transcription text received');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Error",
        description: "Failed to process audio",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsTranscribing(false);
        setProgress(0);
      }, 1000);
    }
  };

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
