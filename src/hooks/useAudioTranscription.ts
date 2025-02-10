
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranscriptionPolling } from './useTranscriptionPolling';

interface TranscriptionResponse {
  jobId?: string;
  text?: string;
}

export const useAudioTranscription = () => {
  const [isTranscriptionPending, setIsTranscriptionPending] = useState(false);
  const { toast } = useToast();
  const { startTranscription, isTranscribing, progress } = useTranscriptionPolling(useCallback((text) => {
    console.log('Transcription complete callback received:', text);
    return text;
  }, []));

  const handleAudioTranscription = async (audioFileName: string): Promise<TranscriptionResponse> => {
    try {
      setIsTranscriptionPending(true);
      console.log('Starting audio transcription process for:', audioFileName);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('Authentication required');
      }

      const response = await startTranscription(audioFileName);
      console.log('Transcription response received:', response);

      if (response?.text) {
        setIsTranscriptionPending(false);
        return { text: response.text };
      } else if (response?.jobId) {
        return { jobId: response.jobId };
      }

      throw new Error('Invalid transcription response');

    } catch (error) {
      console.error('Audio transcription error:', error);
      throw error;
    } finally {
      setIsTranscriptionPending(false);
    }
  };

  return {
    isTranscriptionPending,
    setIsTranscriptionPending,
    handleAudioTranscription,
    isTranscribing,
    progress
  };
};
