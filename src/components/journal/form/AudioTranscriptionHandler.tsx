
import React, { useEffect, useState } from 'react';
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
  const [isTranscriptionPending, setIsTranscriptionPending] = useState(false);

  const handleAudioTranscription = async (audioFileName: string) => {
    try {
      console.log('Starting audio transcription process for:', audioFileName);
      onTranscriptionStart();
      setIsTranscriptionPending(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated session found');
      }

      // Queue the transcription job
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { 
          audioUrl: audioFileName,
          userId: session.user.id
        }
      });

      if (error) {
        console.error('Error invoking transcribe-audio function:', error);
        throw error;
      }

      console.log('Transcription job response:', data);
      
      if (!data?.jobId) {
        throw new Error('No job ID received');
      }

      // Start polling for the result
      const pollInterval = setInterval(async () => {
        console.log('Polling for transcription result...');
        
        const { data: jobData, error: pollError } = await supabase
          .from('transcription_queue')
          .select('status, result, error')
          .eq('id', data.jobId)
          .single();

        if (pollError) {
          console.error('Polling error:', pollError);
          return;
        }

        console.log('Current job status:', jobData?.status);

        if (jobData?.status === 'completed' && jobData.result) {
          clearInterval(pollInterval);
          console.log('Transcription completed:', jobData.result);
          onTranscriptionComplete(jobData.result);
          onTranscriptionEnd();
          setIsTranscriptionPending(false);
          toast({
            title: "Success",
            description: "Audio transcribed successfully",
          });
        } else if (jobData?.status === 'failed') {
          clearInterval(pollInterval);
          console.error('Transcription failed:', jobData.error);
          toast({
            title: "Error",
            description: jobData.error || "Failed to transcribe audio",
            variant: "destructive",
          });
          setIsTranscriptionPending(false);
          onTranscriptionEnd();
        }
      }, 3000); // Poll every 3 seconds

      // Cleanup polling after 5 minutes (timeout)
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isTranscriptionPending) {
          setIsTranscriptionPending(false);
          onTranscriptionEnd();
          toast({
            title: "Timeout",
            description: "Transcription is taking longer than expected. Please try again.",
            variant: "destructive",
          });
        }
      }, 300000);

    } catch (err) {
      console.error('Transcription error:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to transcribe audio",
        variant: "destructive",
      });
      setIsTranscriptionPending(false);
      onTranscriptionEnd();
    }
  };

  // Listen for audio file name changes in Supabase storage
  useEffect(() => {
    const storageChanges = supabase.storage
      .from('audio_files')
      .on('INSERT', payload => {
        console.log('New audio file detected:', payload);
        if (payload.new) {
          handleAudioTranscription(payload.new.name);
        }
      })
      .subscribe();

    return () => {
      storageChanges.unsubscribe();
    };
  }, []);

  return null;
};

export default AudioTranscriptionHandler;
