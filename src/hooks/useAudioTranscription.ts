
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAudioTranscription = () => {
  const [isTranscriptionPending, setIsTranscriptionPending] = useState(false);
  const { toast } = useToast();

  const handleAudioTranscription = async (audioFileName: string) => {
    try {
      setIsTranscriptionPending(true);
      console.log('Starting audio transcription process for:', audioFileName);
      
      // Get the current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
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

      if (!data) {
        throw new Error('No response from transcription service');
      }

      console.log('Transcription response:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.jobId) {
        console.log('Transcription job queued with ID:', data.jobId);
        // Start polling for the result
        let attempts = 0;
        const maxAttempts = 30; // 1.5 minutes maximum polling time
        const pollInterval = 3000; // Poll every 3 seconds

        const pollForResult = async () => {
          if (attempts >= maxAttempts) {
            throw new Error('Transcription timed out');
          }

          const { data: jobData, error: pollError } = await supabase
            .from('transcription_queue')
            .select('status, result, error')
            .eq('id', data.jobId)
            .single();

          if (pollError) {
            throw pollError;
          }

          console.log('Job status:', jobData?.status);

          if (jobData?.status === 'completed' && jobData.result) {
            return jobData.result;
          } else if (jobData?.status === 'failed') {
            throw new Error(jobData.error || 'Transcription failed');
          }

          attempts++;
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          return pollForResult();
        };

        const transcriptionText = await pollForResult();
        console.log('Final transcription:', transcriptionText);
        return transcriptionText;
      }

      return null;
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription Failed",
        description: error instanceof Error ? error.message : "Failed to transcribe audio",
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
