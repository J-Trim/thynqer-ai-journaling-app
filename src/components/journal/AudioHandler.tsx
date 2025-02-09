
import { useState, useEffect, useCallback } from "react";
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
  const [jobId, setJobId] = useState<string | null>(null);
  const { toast } = useToast();

  const checkTranscriptionStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      const { data: job, error } = await supabase
        .from('transcription_queue')
        .select('status, result, error')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      if (job) {
        if (job.status === 'completed' && job.result) {
          setIsTranscribing(false);
          setProgress(100);
          onTranscriptionComplete(job.result);
          setJobId(null);
          toast({
            title: "Success",
            description: "Audio transcribed successfully",
          });
        } else if (job.status === 'failed') {
          setIsTranscribing(false);
          setJobId(null);
          throw new Error(job.error || 'Transcription failed');
        } else if (job.status === 'processing') {
          setProgress((prev) => Math.min(prev + 10, 90));
        }
      }
    } catch (error) {
      setIsTranscribing(false);
      setJobId(null);
      console.error('Polling error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check transcription status",
        variant: "destructive",
      });
    }
  }, [jobId, onTranscriptionComplete, toast]);

  useEffect(() => {
    let pollInterval: number | null = null;

    if (jobId && isTranscribing) {
      pollInterval = window.setInterval(checkTranscriptionStatus, 3000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [jobId, isTranscribing, checkTranscriptionStatus]);

  const handleAudioSaved = async (audioFileName: string) => {
    try {
      setIsTranscribing(true);
      setProgress(0);
      console.log('Starting audio transcription process for:', audioFileName);
      
      onAudioSaved(audioFileName);
      
      console.log('Invoking transcribe-audio function...');
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioUrl: audioFileName }
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }

      if (data?.jobId) {
        setJobId(data.jobId);
        toast({
          title: "Processing",
          description: "Audio transcription has started...",
        });
      } else {
        throw new Error('No job ID received');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setIsTranscribing(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process audio",
        variant: "destructive",
      });
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
