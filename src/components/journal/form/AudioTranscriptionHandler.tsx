
import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAudioTranscription } from '@/hooks/useAudioTranscription';

interface AudioTranscriptionHandlerProps {
  audioUrl: string | null;
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionStart: () => void;
  onTranscriptionEnd: () => void;
}

const AudioTranscriptionHandler: React.FC<AudioTranscriptionHandlerProps> = ({
  audioUrl,
  onTranscriptionComplete,
  onTranscriptionStart,
  onTranscriptionEnd,
}) => {
  const { toast } = useToast();
  const { handleAudioTranscription, isTranscriptionPending, isTranscribing, progress } = useAudioTranscription();

  useEffect(() => {
    const transcribeAudio = async () => {
      if (!audioUrl) {
        console.log('No audio URL provided');
        return;
      }

      try {
        console.log('Starting transcription for:', audioUrl);
        onTranscriptionStart();
        
        const response = await handleAudioTranscription(audioUrl);
        console.log('Got transcription response:', response);
        
        if (response?.text) {
          console.log('Transcription completed with text:', response.text);
          onTranscriptionComplete(response.text);
        } else {
          console.log('Transcription job started without immediate result:', response);
        }
      } catch (error) {
        console.error('Transcription handling error:', error);
        toast({
          title: "Transcription Failed",
          description: error instanceof Error ? error.message : "Failed to process audio transcription",
          variant: "destructive",
        });
      } finally {
        onTranscriptionEnd();
      }
    };

    if (audioUrl) {
      transcribeAudio();
    }
  }, [audioUrl]);

  return null;
};

export default AudioTranscriptionHandler;
