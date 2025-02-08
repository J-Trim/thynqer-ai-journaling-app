
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { logError } from '../utils/logger.ts';

interface TranscriptionJob {
  id: string;
  audio_url: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export class TranscriptionQueue {
  private supabase: any;
  private processingJobs = new Set<string>();
  
  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
  }

  async enqueueJob(audioUrl: string, userId: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('transcription_queue')
        .insert({
          audio_url: audioUrl,
          user_id: userId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      logError('enqueueJob', error, { audioUrl, userId });
      throw error;
    }
  }

  async processNextBatch(batchSize = 5): Promise<void> {
    try {
      const { data: jobs, error } = await this.supabase
        .from('transcription_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(batchSize);

      if (error) throw error;
      if (!jobs?.length) return;

      const processJob = async (job: TranscriptionJob) => {
        if (this.processingJobs.has(job.id)) return;
        this.processingJobs.add(job.id);

        try {
          await this.supabase
            .from('transcription_queue')
            .update({ status: 'processing' })
            .eq('id', job.id);

          // Get the audio file name from the URL
          const audioFileName = job.audio_url.split('/').pop();
          if (!audioFileName) {
            throw new Error('Invalid audio URL format');
          }

          // Create a signed URL for the audio file
          const { data: signedUrlData, error: signedUrlError } = await this.supabase
            .storage
            .from('audio_files')
            .createSignedUrl(audioFileName, 60); // URL expires in 60 seconds

          if (signedUrlError || !signedUrlData?.signedUrl) {
            throw new Error(`Failed to create signed URL: ${signedUrlError?.message || 'No URL generated'}`);
          }

          // Download the audio file using the signed URL
          const audioResponse = await fetch(signedUrlData.signedUrl);
          if (!audioResponse.ok) {
            throw new Error(`Failed to download audio: HTTP ${audioResponse.status}`);
          }

          const audioBlob = await audioResponse.blob();

          // Prepare the form data for Whisper API
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');
          formData.append('model', 'whisper-1');

          // Call Whisper API with proper error handling
          const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            },
            body: formData
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Whisper API Error: ${errorText}`);
          }

          const result = await response.json();

          // Update the job with the transcription result
          await this.supabase
            .from('transcription_queue')
            .update({ 
              status: 'completed',
              result: result.text 
            })
            .eq('id', job.id);

        } catch (error) {
          logError('processJob', error, { jobId: job.id });
          await this.supabase
            .from('transcription_queue')
            .update({ 
              status: 'failed',
              error: error.message
            })
            .eq('id', job.id);
        } finally {
          this.processingJobs.delete(job.id);
        }
      };

      // Process jobs with a delay between each to avoid rate limits
      for (const job of jobs) {
        await processJob(job);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    } catch (error) {
      logError('processNextBatch', error);
      throw error;
    }
  }
}

export const queue = new TranscriptionQueue();

