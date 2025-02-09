
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
  const { handleAudioTranscription, isTranscriptionPending } = useAudioTranscription();

  useEffect(() => {
    const transcribeAudio = async () => {
      if (!audioUrl) {
        console.log('No audio URL provided');
        return;
      }

      try {
        console.log('Starting transcription for:', audioUrl);
        onTranscriptionStart();

        const transcriptionResult = await handleAudioTranscription(audioUrl);
        
        if (transcriptionResult?.jobId) {
          console.log('Transcription job started with ID:', transcriptionResult.jobId);
          toast({
            title: "Processing",
            description: "Audio transcription in progress...",
          });
        } else if (transcriptionResult?.text) {
          console.log('Transcription completed:', transcriptionResult.text);
          onTranscriptionComplete(transcriptionResult.text);
          toast({
            title: "Success",
            description: "Audio transcribed successfully",
          });
        } else {
          console.error('Invalid transcription response:', transcriptionResult);
          throw new Error('Invalid transcription response');
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
