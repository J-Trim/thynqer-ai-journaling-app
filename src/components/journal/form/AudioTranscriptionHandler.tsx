
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
  const { handleAudioTranscription } = useAudioTranscription();

  useEffect(() => {
    let isActive = true;

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
        
        if (!isActive) {
          console.log('Component unmounted, skipping transcription update');
          return;
        }

        if (!response?.text || typeof response.text !== 'string') {
          console.error('Invalid or missing transcription text:', response);
          return;
        }

        console.log('Setting transcription text:', response.text);
        onTranscriptionComplete(response.text);
        toast({
          title: "Success",
          description: "Audio transcription completed",
        });

      } catch (error) {
        console.error('Transcription handling error:', error);
        toast({
          title: "Transcription Failed",
          description: error instanceof Error ? error.message : "Failed to process audio transcription",
          variant: "destructive",
        });
      } finally {
        if (isActive) {
          onTranscriptionEnd();
        }
      }
    };

    if (audioUrl) {
      transcribeAudio();
    }

    return () => {
      isActive = false;
    };
  }, [audioUrl]);

  return null;
};

export default AudioTranscriptionHandler;
