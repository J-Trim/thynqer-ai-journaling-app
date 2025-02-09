
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import AudioRecorder from "@/components/AudioRecorder";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { handleError } from "@/utils/errorHandler";
import { TransformationError } from "./transformations/TransformationError";

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
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'network' | 'validation' | 'server' | 'general' | null>(null);
  const { toast } = useToast();

  const checkTranscriptionStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      const { data: job, error: fetchError } = await supabase
        .from('transcription_queue')
        .select('status, result, error')
        .eq('id', jobId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (!job) {
        throw new Error('Transcription job not found');
      }

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
        throw new Error(job.error || 'Transcription failed');
      } else if (job.status === 'processing') {
        setProgress((prev) => Math.min(prev + 10, 90));
      }
    } catch (error) {
      handleError({
        type: 'server',
        message: 'Failed to check transcription status',
        context: 'TranscriptionStatusCheck',
        error
      });
      setIsTranscribing(false);
      setJobId(null);
      setError('Failed to check transcription status. Please try again.');
      setErrorType('server');
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
      setError(null);
      setErrorType(null);
      
      console.log('Starting audio transcription process for:', audioFileName);
      onAudioSaved(audioFileName);
      
      const { data, error: functionError } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioUrl: audioFileName }
      });

      if (functionError) {
        throw functionError;
      }

      if (!data?.jobId) {
        throw new Error('No job ID received from transcription service');
      }

      setJobId(data.jobId);
      toast({
        title: "Processing",
        description: "Audio transcription has started...",
      });
    } catch (error) {
      handleError({
        type: 'server',
        message: 'Failed to process audio',
        context: 'AudioTranscription',
        error
      });
      setIsTranscribing(false);
      setError('Failed to process audio. Please try again.');
      setErrorType('server');
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

