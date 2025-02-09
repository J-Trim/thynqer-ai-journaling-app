
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
        console.error('Edge function error:', error);
        throw new Error(`Transcription failed: ${error.message}`);
      }

      if (!data) {
        console.error('No response data from transcription service');
        throw new Error('No response from transcription service');
      }

      console.log('Transcription response:', data);

      if (data.error) {
        console.error('Transcription error from service:', data.error);
        throw new Error(data.error);
      }

      // Check for job ID and poll for results
      if (data.jobId) {
        console.log('Transcription job queued with ID:', data.jobId);
        
        // Start polling with exponential backoff
        let attempts = 0;
        const maxAttempts = 30; // 3 minutes maximum polling time
        const baseInterval = 3000; // Start with 3 second intervals

        const pollForResult = async (): Promise<string> => {
          if (attempts >= maxAttempts) {
            throw new Error('Transcription timed out after 3 minutes');
          }

          const { data: jobData, error: pollError } = await supabase
            .from('transcription_queue')
            .select('status, result, error')
            .eq('id', data.jobId)
            .single();

          if (pollError) {
            console.error('Poll error:', pollError);
            throw new Error('Failed to check transcription status');
          }

          console.log('Job status:', jobData?.status, 'Attempt:', attempts + 1);

          if (jobData?.status === 'completed' && jobData.result) {
            return jobData.result;
          } 
          
          if (jobData?.status === 'failed') {
            throw new Error(jobData.error || 'Transcription processing failed');
          }

          attempts++;
          // Exponential backoff with a max of 10 seconds
          const delay = Math.min(baseInterval * Math.pow(1.5, attempts), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          return pollForResult();
        };

        const transcriptionText = await pollForResult();
        console.log('Final transcription:', transcriptionText);
        return transcriptionText;
      }

      throw new Error('Invalid response format from transcription service');
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
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
