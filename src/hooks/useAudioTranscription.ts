import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAudioTranscription = () => {
  const [isTranscriptionPending, setIsTranscriptionPending] = useState(false);
  const { toast } = useToast();

  const handleAudioTranscription = async (audioFileName: string) => {
    try {
      console.log('Starting audio transcription process for:', audioFileName);
      
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioUrl: audioFileName }
      });

      if (error) throw error;

      if (data?.text) {
        console.log('Transcription completed successfully');
        return data.text;
      } else {
        throw new Error('No transcription text received');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Error",
        description: "Failed to transcribe audio",
        variant: "destructive",
      });
      return null;
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
    cleanupAudioAndTranscription
  };
};