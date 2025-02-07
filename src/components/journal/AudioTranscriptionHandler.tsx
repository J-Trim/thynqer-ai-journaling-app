
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AudioTranscriptionHandlerProps {
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionStart: () => void;
  onTranscriptionEnd: () => void;
}

const AudioTranscriptionHandler: React.FC<AudioTranscriptionHandlerProps> = ({
  onTranscriptionComplete,
  onTranscriptionStart,
  onTranscriptionEnd
}) => {
  const { toast } = useToast();

  const handleAudioTranscription = async (audioFileName: string) => {
    try {
      console.log('Starting audio transcription process for:', audioFileName);
      onTranscriptionStart();
      
      if (!audioFileName) {
        throw new Error('No audio file name provided');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { 
          audioUrl: audioFileName,
          userId: session.user.id
        }
      });

      if (error) {
        console.error('Transcription function error:', error);
        throw error;
      }

      if (!data?.text) {
        throw new Error('No transcription text received');
      }

      console.log('Transcription completed successfully');
      onTranscriptionComplete(data.text);
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription Failed",
        description: error instanceof Error 
          ? error.message 
          : "Failed to transcribe audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      onTranscriptionEnd();
    }
  };

  return null;
};

export default AudioTranscriptionHandler;
