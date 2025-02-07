
import { SupabaseClient } from "@supabase/supabase-js";

export const checkCache = async (
  supabase: SupabaseClient,
  inputHash: string,
  transformationType: string
): Promise<string | null> => {
  console.log('Checking cache for transformation...');
  const { data: cacheHit } = await supabase
    .from('summary_cache')
    .select('cached_result')
    .eq('input_hash', inputHash)
    .eq('transformation_type', transformationType)
    .single();

  return cacheHit?.cached_result || null;
};

export const saveToCache = async (
  supabase: SupabaseClient,
  inputHash: string,
  transformationType: string,
  text: string,
  transformedText: string,
  promptTemplate?: string
) => {
  console.log('Caching transformation result...');
  const { error: cacheError } = await supabase
    .from('summary_cache')
    .insert({
      input_text: text,
      transformation_type: transformationType,
      prompt_template: promptTemplate || getSystemPrompt(transformationType),
      cached_result: transformedText,
      input_hash: inputHash
    });

  if (cacheError) {
    console.error('Error caching result:', cacheError);
  }
};
