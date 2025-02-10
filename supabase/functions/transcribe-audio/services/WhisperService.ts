
import { logError } from '../utils/logger.ts';
import { getMimeType } from '../utils/audio.ts';

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
      logError('WhisperAPI', new Error('OpenAI API key not configured'), {
        attempt,
        fileName
      });
      throw new Error('OpenAI API key not configured');
    }

    // Create FormData with proper MIME type handling
    const formData = new FormData();
    const mimeType = getMimeType(fileName);
    const extension = fileName.split('.').pop() || 'webm';
    
    // Always include required model parameter first
    formData.append('model', 'whisper-1');
    
    // Append the audio file with correct filename and MIME type
    formData.append('file', new Blob([audioBlob], { type: mimeType }), `audio.${extension}`);
    
    // Add optional parameters
    formData.append('response_format', 'verbose_json');
    formData.append('language', 'en');  // Force English language detection

    console.log(`Attempt ${attempt}: Initiating Whisper API request for file ${fileName}`, {
      mimeType,
      extension,
      blobSize: audioBlob.size
    });
    
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
        // If JSON parsing fails, use generic message
      }
      throw new Error(`Whisper API Error: ${errorMessage}`);
    }

    const jsonResponse = await response.json();
    console.log('Whisper API raw response:', jsonResponse);
    return jsonResponse;
  }

  async transcribe(audioBlob: Blob, fileName: string): Promise<WhisperResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await this.callWhisperAPI(audioBlob, fileName, attempt);
        console.log('Whisper API transcription result:', {
          text: response.text,
          language: response.language,
          hasSegments: !!response.segments?.length
        });
        return response;
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
    console.log('Processing Whisper response:', response);
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

