
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
    const transcribeAudio = async () => {
      if (!audioUrl) {
        console.log('No audio URL provided');
        return;
      }

      try {
        console.log('Starting transcription for:', audioUrl);
        onTranscriptionStart();

        const transcriptionText = await handleAudioTranscription(audioUrl);
        
        if (transcriptionText) {
          console.log('Transcription completed:', transcriptionText);
          onTranscriptionComplete(transcriptionText);
          toast({
            title: "Success",
            description: "Audio transcribed successfully",
          });
        } else {
          console.error('No transcription text received from service');
          throw new Error('No transcription text received');
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
