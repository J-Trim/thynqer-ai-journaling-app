
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
  
  // Create a stable callback for handling transcription completion
  const handleTranscriptionComplete = useCallback((text: string) => {
    console.log('Transcription complete, received text:', text);
    return text;
  }, []);

  const { startTranscription, isTranscribing, progress } = useTranscriptionPolling(handleTranscriptionComplete);

  const handleAudioTranscription = async (audioFileName: string): Promise<TranscriptionResponse> => {
    try {
      if (isTranscriptionPending) {
        console.log('Transcription already in progress, skipping');
        return {};
      }

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
        toast({
          title: "Transcription Complete",
          description: "Audio has been transcribed successfully",
        });
        return { text: response.text };
      } else if (response?.jobId) {
        return { jobId: response.jobId };
      }

      throw new Error('Invalid transcription response');

    } catch (error) {
      console.error('Audio transcription error:', error);
      setIsTranscriptionPending(false);
      throw error;
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
