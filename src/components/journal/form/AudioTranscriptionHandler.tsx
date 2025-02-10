
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
  const { handleAudioTranscription, isTranscriptionPending, isTranscribing, progress } = useAudioTranscription(onTranscriptionComplete);

  useEffect(() => {
    let isMounted = true;

    const transcribeAudio = async () => {
      if (!audioUrl) {
        console.log('No audio URL provided');
        return;
      }

      try {
        console.log('Starting transcription for:', audioUrl);
        onTranscriptionStart();
        
        const response = await handleAudioTranscription(audioUrl);
        
        if (!isMounted) return;
        
        console.log('Got transcription response:', response);
        
        if (!response?.jobId && !response?.text) {
          throw new Error('Invalid transcription response');
        }
        
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Transcription handling error:', error);
        toast({
          title: "Transcription Failed",
          description: error instanceof Error ? error.message : "Failed to process audio transcription",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          onTranscriptionEnd();
        }
      }
    };

    if (audioUrl) {
      transcribeAudio();
    }

    return () => {
      isMounted = false;
    };
  }, [audioUrl, onTranscriptionComplete, onTranscriptionStart, onTranscriptionEnd, handleAudioTranscription, toast]);

  return null;
};

export default AudioTranscriptionHandler;
