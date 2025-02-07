
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
      // Get pending jobs not currently being processed
      const { data: jobs, error } = await this.supabase
        .from('transcription_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(batchSize);

      if (error) throw error;
      if (!jobs?.length) return;

      // Process jobs in parallel with rate limiting
      const processJob = async (job: TranscriptionJob) => {
        if (this.processingJobs.has(job.id)) return;
        this.processingJobs.add(job.id);

        try {
          await this.supabase
            .from('transcription_queue')
            .update({ status: 'processing' })
            .eq('id', job.id);

          // Process transcription with language hint
          const formData = new FormData();
          formData.append('file', new Blob([job.audio_url]), 'audio.mp3');
          formData.append('model', 'whisper-1');
          formData.append('language', 'en'); // Add language hint

          const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            },
            body: formData
          });

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${await response.text()}`);
          }

          const result = await response.json();

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
