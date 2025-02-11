
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { handleError } from "@/utils/errorHandler";

interface TranscriptionResponse {
  jobId?: string;
  text?: string;
  result?: string;
}

export const useTranscriptionPolling = (
  onTranscriptionComplete: (text: string) => void
) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'network' | 'validation' | 'server' | 'general' | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const checkTranscriptionStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      console.log('Checking transcription status for job:', jobId);
      
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

      console.log('Checking transcription status:', job);

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
      abortControllerRef.current = new AbortController();
      pollInterval = window.setInterval(checkTranscriptionStatus, 3000);
      console.log('Started polling for job:', jobId);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        console.log('Stopped polling for job:', jobId);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [jobId, isTranscribing, checkTranscriptionStatus]);

  const startTranscription = useCallback(async (audioFileName: string): Promise<TranscriptionResponse> => {
    try {
      setIsTranscribing(true);
      setProgress(0);
      setError(null);
      setErrorType(null);
      
      console.log('Starting audio transcription process for:', audioFileName);
      
      const { data, error: functionError } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioUrl: audioFileName }
      });

      if (functionError) {
        throw functionError;
      }

      console.log('Transcription response:', data);

      if (data?.text) {
        // If we got an immediate result
        onTranscriptionComplete(data.text);
        setIsTranscribing(false);
        setProgress(100);
        toast({
          title: "Success",
          description: "Audio transcribed successfully",
        });
        return { text: data.text };
      }

      if (data?.jobId) {
        setJobId(data.jobId);
        toast({
          title: "Processing",
          description: "Audio transcription has started...",
        });
        return { jobId: data.jobId };
      }

      throw new Error('No job ID or result received from transcription service');
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
      throw error;
    }
  }, [onTranscriptionComplete, toast]);

  return {
    isTranscribing,
    progress,
    error,
    errorType,
    startTranscription
  };
};
