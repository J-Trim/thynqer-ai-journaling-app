
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranscriptionPolling } from './useTranscriptionPolling';

interface TranscriptionResponse {
  jobId?: string;
  text?: string;
}

export const useAudioTranscription = (onTranscriptionComplete: (text: string) => void) => {
  const [isTranscriptionPending, setIsTranscriptionPending] = useState(false);
  const { toast } = useToast();
  
  const { startTranscription, isTranscribing, progress } = useTranscriptionPolling(useCallback((text: string) => {
    console.log('Received transcribed text:', text);
    // Only call onTranscriptionComplete from the polling callback
    onTranscriptionComplete(text);
    return text;
  }, [onTranscriptionComplete]));

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
      
      // Remove this to avoid double completion
      // if (response.text) {
      //   onTranscriptionComplete(response.text);
      // }
      
      return response;

    } catch (error) {
      console.error('Audio transcription error:', error);
      throw error;
    } finally {
      setIsTranscriptionPending(false);
    }
  };

  const cleanupAudioAndTranscription = async (audioUrl: string | null) => {
    if (audioUrl) {
      try {
        const { error } = await supabase.storage
          .from('audio_files')
          .remove([audioUrl]);
        
        if (error) throw error;
        
        console.log('Audio cleanup completed successfully');
        return true;
      } catch (error) {
        console.error('Error during audio cleanup:', error);
        toast({
          title: "Error",
          description: "Failed to cleanup audio files",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  return {
    isTranscriptionPending,
    setIsTranscriptionPending,
    handleAudioTranscription,
    cleanupAudioAndTranscription,
    isTranscribing,
    progress
  };
};
