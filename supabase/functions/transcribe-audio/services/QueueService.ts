
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logError } from '../utils/logger.ts';
import { StorageService } from './StorageService.ts';
import { WhisperService } from './WhisperService.ts';
import { getMimeType } from '../utils/audio.ts';

interface TranscriptionJob {
  id: string;
  audio_url: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
    confidence?: number;
  }>;
}

export class QueueService {
  private supabase: any;
  private processingJobs = new Set<string>();
  private storageService: StorageService;
  private whisperService: WhisperService;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    this.storageService = new StorageService();
    this.whisperService = new WhisperService();
  }

  private async updateJobStatus(jobId: string, status: TranscriptionJob['status'], data?: Partial<TranscriptionJob>) {
    const updateData = { status, ...data };
    const { error } = await this.supabase
      .from('transcription_queue')
      .update(updateData)
      .eq('id', jobId);
    
    if (error) {
      console.error('Error updating job status:', error);
      throw error;
    }
  }

  async enqueueJob(audioUrl: string, userId: string): Promise<string> {
    try {
      console.log('Enqueueing job for:', { audioUrl, userId });
      const { data, error } = await this.supabase
        .from('transcription_queue')
        .insert({
          audio_url: audioUrl,
          user_id: userId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error enqueueing job:', error);
        throw error;
      }
      
      console.log('Job enqueued successfully:', data.id);
      return data.id;
    } catch (error) {
      logError('enqueueJob', error, { audioUrl, userId });
      throw error;
    }
  }

  async processNextBatch(batchSize = 5): Promise<void> {
    try {
      console.log('Processing next batch of jobs...');
      const { data: jobs, error } = await this.supabase
        .from('transcription_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(batchSize);

      if (error) {
        console.error('Error fetching pending jobs:', error);
        throw error;
      }

      if (!jobs?.length) {
        console.log('No pending jobs to process');
        return;
      }

      console.log(`Found ${jobs.length} jobs to process`);

      const processJob = async (job: TranscriptionJob) => {
        if (this.processingJobs.has(job.id)) {
          console.log(`Job ${job.id} is already being processed`);
          return;
        }
        
        this.processingJobs.add(job.id);
        console.log(`Starting to process job ${job.id}`);

        try {
          await this.updateJobStatus(job.id, 'processing');

          const audioFileName = job.audio_url;
          if (!audioFileName) {
            throw new Error('Invalid audio URL format');
          }

          console.log('Getting signed URL for:', audioFileName);
          const signedUrl = await this.storageService.createSignedUrl(audioFileName);
          
          console.log('Downloading audio...');
          const audioArrayBuffer = await this.storageService.downloadAudio(signedUrl);
          
          const mimeType = getMimeType(audioFileName);
          console.log('Creating audio blob with MIME type:', mimeType);
          const audioBlob = new Blob([audioArrayBuffer], { type: mimeType });
          
          console.log('Calling Whisper API...');
          const whisperResponse = await this.whisperService.transcribe(audioBlob, audioFileName);
          const processedResponse = this.whisperService.processResponse(whisperResponse);

          console.log('Updating job with transcription result...');
          await this.updateJobStatus(job.id, 'completed', {
            result: processedResponse.text,
            language: processedResponse.language
          });

          console.log(`Job ${job.id} completed successfully`);

        } catch (error) {
          console.error(`Error processing job ${job.id}:`, error);
          logError('processJob', error, { jobId: job.id });
          await this.updateJobStatus(job.id, 'failed', { error: error.message });
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
      console.error('Error in processNextBatch:', error);
      logError('processNextBatch', error);
      throw error;
    }
  }
}

export const queue = new QueueService();
