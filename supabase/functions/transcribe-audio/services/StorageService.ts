
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logError } from '../utils/logger.ts';
import { getMimeType } from '../utils/audio.ts';

export class StorageService {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
  }

  async createSignedUrl(audioFileName: string): Promise<string> {
    const { data: signedUrlData, error: signedUrlError } = await this.supabase
      .storage
      .from('audio_files')
      .createSignedUrl(audioFileName, 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error(`Failed to create signed URL: ${signedUrlError?.message || 'No URL generated'}`);
    }

    return signedUrlData.signedUrl;
  }

  async downloadAudio(signedUrl: string): Promise<ArrayBuffer> {
    const audioResponse = await fetch(signedUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: HTTP ${audioResponse.status}`);
    }
    return audioResponse.arrayBuffer();
  }
}
