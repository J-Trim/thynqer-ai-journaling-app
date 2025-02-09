
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
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
  
  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
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

  private async callWhisperAPI(audioBlob: Blob, fileName: string): Promise<WhisperResponse> {
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    const formData = new FormData();
    formData.append('file', audioBlob, `audio.${fileName.split('.').pop()}`);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');

    console.log('Initiating Whisper API request...');
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Whisper API Error - Status: ${response.status}`);
      throw new Error(`Whisper API Error: ${errorText}`);
    }

    return response.json();
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
    await this.supabase
      .from('transcription_queue')
      .update(updateData)
      .eq('id', jobId);
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
          await this.updateJobStatus(job.id, 'processing');

          const audioFileName = job.audio_url.split('/').pop();
          if (!audioFileName) {
            throw new Error('Invalid audio URL format');
          }

          const mimeType = getMimeType(audioFileName);
          console.log('Detected MIME type:', mimeType);

          const signedUrl = await this.createSignedUrl(audioFileName);
          const audioArrayBuffer = await this.downloadAudio(signedUrl);
          const audioBlob = new Blob([audioArrayBuffer], { type: mimeType });
          console.log('Created audio blob with type:', mimeType);

          const whisperResponse = await this.callWhisperAPI(audioBlob, audioFileName);
          const processedResponse = this.processWhisperResponse(whisperResponse);

          await this.updateJobStatus(job.id, 'completed', processedResponse);

        } catch (error) {
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
      logError('processNextBatch', error);
      throw error;
    }
  }
}

export const queue = new TranscriptionQueue();

