
import { logError } from '../utils/logger.ts';

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

export class WhisperService {
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY = 1000;

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
    const baseDelay = this.BASE_DELAY * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.5 + 0.75;
    return Math.floor(baseDelay * jitter);
  }

  private async callWhisperAPI(audioBlob: Blob, fileName: string, attempt = 1): Promise<WhisperResponse> {
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Ensure we're creating a proper multipart/form-data request
    const formData = new FormData();
    
    // Append the audio file with correct filename and mime type
    const fileExtension = fileName.split('.').pop() || 'webm';
    const mimeType = fileExtension === 'webm' ? 'audio/webm' : 'audio/mpeg';
    formData.append('file', audioBlob, `audio.${fileExtension}`);
    
    // IMPORTANT: Always include the model parameter
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');

    console.log(`Attempt ${attempt}: Initiating Whisper API request for file ${fileName}`);
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        // Let the FormData set its own Content-Type with boundary
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

  async transcribe(audioBlob: Blob, fileName: string): Promise<WhisperResponse> {
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

  processResponse(response: WhisperResponse) {
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
}

