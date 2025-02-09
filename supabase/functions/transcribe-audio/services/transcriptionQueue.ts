
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logError } from '../utils/logger.ts';
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

interface WhisperResponse {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
    avg_logprob?: number;
  }>;
}

export class TranscriptionQueue {
  private supabase: any;
  private processingJobs = new Set<string>();
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY = 1000; // 1 second
  
  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
  }

  private isRetriableError(error: any): boolean {
    if (!error) return false;
    const message = error.message || '';
    
    // Don't retry client errors (4xx) except for rate limits (429)
    if (message.includes('HTTP 4') && !message.includes('429')) {
      return false;
    }
    
    // Retry on network errors, rate limits, or server errors
    return true;
  }

  private getBackoffDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.BASE_DELAY * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.5 + 0.75; // Random factor between 0.75 and 1.25
    return Math.floor(baseDelay * jitter);
  }

  private async createSignedUrl(audioFileName: string): Promise<string> {
    const { data: signedUrlData, error: signedUrlError } = await this.supabase
      .storage
      .from('audio_files')
      .createSignedUrl(audioFileName, 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error(`Failed to create signed URL: ${signedUrlError?.message || 'No URL generated'}`);
    }

    return signedUrlData.signedUrl;
  }

  private async downloadAudio(signedUrl: string): Promise<ArrayBuffer> {
    const audioResponse = await fetch(signedUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: HTTP ${audioResponse.status}`);
    }
    return audioResponse.arrayBuffer();
  }

  private async callWhisperAPI(audioBlob: Blob, fileName: string, attempt = 1): Promise<WhisperResponse> {
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    const formData = new FormData();
    formData.append('file', audioBlob, `audio.${fileName.split('.').pop()}`);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');

    console.log(`Attempt ${attempt}: Initiating Whisper API request...`);
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage += `: ${errorData.error.message || errorData.error}`;
        }
      } catch {
        // Ignore JSON parse errors, use generic message
      }
      throw new Error(`Whisper API Error: ${errorMessage}`);
    }

    return response.json();
  }

  private async callWhisperWithRetry(audioBlob: Blob, fileName: string): Promise<WhisperResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await this.callWhisperAPI(audioBlob, fileName, attempt);
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error.message);

        if (attempt < this.MAX_RETRIES && this.isRetriableError(error)) {
          const delay = this.getBackoffDelay(attempt);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        break;
      }
    }

    throw lastError || new Error('Transcription failed after all retries');
  }

  private processWhisperResponse(response: WhisperResponse) {
    return {
      text: response.text,
      language: response.language,
      duration: response.duration,
      segments: response.segments?.map(segment => ({
        start: segment.start,
        end: segment.end,
        text: segment.text.trim(),
        confidence: segment.avg_logprob ? Math.exp(segment.avg_logprob) : undefined
      })) || []
    };
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
          const signedUrl = await this.createSignedUrl(audioFileName);
          
          console.log('Downloading audio...');
          const audioArrayBuffer = await this.downloadAudio(signedUrl);
          
          const mimeType = getMimeType(audioFileName);
          console.log('Creating audio blob with MIME type:', mimeType);
          const audioBlob = new Blob([audioArrayBuffer], { type: mimeType });
          
          console.log('Calling Whisper API...');
          const whisperResponse = await this.callWhisperWithRetry(audioBlob, audioFileName);
          const processedResponse = this.processWhisperResponse(whisperResponse);

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

export const queue = new TranscriptionQueue();

