
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
    console.log('Transcription complete callback triggered:', {
      textLength: text.length,
      textPreview: text.substring(0, 50) + '...',
      timestamp: new Date().toISOString(),
      exactText: text,
      hasWhitespace: /^\s|\s$/.test(text),
      whitespaceLocations: text.split('').map((char, i) => char === ' ' ? i : null).filter(i => i !== null)
    });
    return text;
  }, []);

  const { startTranscription, isTranscribing, progress } = useTranscriptionPolling(handleTranscriptionComplete);

  const handleAudioTranscription = async (audioFileName: string): Promise<TranscriptionResponse> => {
    try {
      console.log('Audio transcription requested:', {
        fileName: audioFileName,
        isPending: isTranscriptionPending,
        timestamp: new Date().toISOString()
      });

      if (isTranscriptionPending) {
        console.log('Transcription already in progress, skipping:', {
          fileName: audioFileName,
          timestamp: new Date().toISOString()
        });
        return {};
      }

      console.log('Setting transcription pending state to true');
      setIsTranscriptionPending(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        console.error('Authentication error:', {
          error: sessionError,
          hasSession: !!session,
          timestamp: new Date().toISOString()
        });
        throw new Error('Authentication required');
      }

      console.log('Starting transcription process:', {
        fileName: audioFileName,
        userId: session.user.id,
        timestamp: new Date().toISOString()
      });

      const response = await startTranscription(audioFileName);
      console.log('Transcription response received:', {
        hasText: !!response?.text,
        hasJobId: !!response?.jobId,
        timestamp: new Date().toISOString(),
        rawResponse: JSON.stringify(response),
        textDetails: response?.text ? {
          length: response.text.length,
          exactText: response.text,
          hasWhitespace: /^\s|\s$/.test(response.text),
          containsSpecialChars: /[^\w\s]/.test(response.text),
          encodedLength: encodeURIComponent(response.text).length
        } : null
      });

      if (response?.text) {
        console.log('Immediate transcription result:', {
          textLength: response.text.length,
          textPreview: response.text.substring(0, 50) + '...',
          timestamp: new Date().toISOString(),
          exactText: response.text,
          trimmedLength: response.text.trim().length,
          diffFromTrimmed: response.text.length - response.text.trim().length
        });
        setIsTranscriptionPending(false);
        toast({
          title: "Transcription Complete",
          description: "Audio has been transcribed successfully",
        });
        return { text: response.text };
      } else if (response?.jobId) {
        console.log('Queued transcription job:', {
          jobId: response.jobId,
          timestamp: new Date().toISOString()
        });
        return { jobId: response.jobId };
      }

      throw new Error('Invalid transcription response');

    } catch (error) {
      console.error('Audio transcription error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        fileName: audioFileName,
        timestamp: new Date().toISOString()
      });
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
