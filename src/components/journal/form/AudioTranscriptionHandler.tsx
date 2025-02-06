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
      
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioUrl: audioFileName }
      });

      if (error) throw error;

      if (data?.text) {
        console.log('Transcription completed successfully');
        onTranscriptionComplete(data.text);
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
    } finally {
      onTranscriptionEnd();
    }
  };

  return null;
};

export default AudioTranscriptionHandler;