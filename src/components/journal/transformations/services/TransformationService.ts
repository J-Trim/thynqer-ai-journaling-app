
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface DefaultPrompt {
  transformation_type: ValidTransformation;
  prompt_template: string;
}

export const transformationService = {
  async getDefaultPrompts(): Promise<DefaultPrompt[]> {
    try {
      const { data, error } = await supabase
        .from('default_prompts')
        .select('transformation_type, prompt_template');

      if (error) {
        console.error('Error fetching default prompts:', error);
        throw new Error(`Failed to fetch default prompts: ${error.message}`);
      }

      if (!data) {
        throw new Error('No default prompts found');
      }

      return data;
    } catch (error) {
      console.error('Error in getDefaultPrompts:', error);
      throw error;
    }
  },

  async transformText(
    entryId: string,
    entryText: string,
    type: ValidTransformation,
    customPrompts: Array<{ prompt_name: string; prompt_template: string }>,
  ) {
    try {
      console.log('Starting transformation with type:', type);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      // First check if this is a custom prompt
      const customPrompt = customPrompts.find(p => p.prompt_name === type);
      
      // If not a custom prompt, try to get the default prompt
      let promptTemplate = '';
      if (!customPrompt) {
        const { data, error: promptError } = await supabase
          .from('default_prompts')
          .select('prompt_template')
          .eq('transformation_type', type)
          .maybeSingle();
        
        if (promptError) {
          throw new Error(`Failed to fetch prompt template: ${promptError.message}`);
        }
        
        promptTemplate = data?.prompt_template || '';
      } else {
        promptTemplate = customPrompt.prompt_template;
      }

      // Call transform-text function with the prompt template
      const { data: transformationData, error: transformError } = await supabase.functions.invoke('transform-text', {
        body: { 
          text: entryText,
          transformationType: type,
          customTemplate: promptTemplate 
        }
      });

      if (transformError) {
        console.error('Transform function error:', transformError);
        throw new Error(`Transformation failed: ${transformError.message}`);
      }

      if (!transformationData) {
        throw new Error('No transformation data received');
      }

      // Save the transformation to the summaries table
      const { error: saveError } = await supabase
        .from('summaries')
        .insert({
          entry_id: entryId,
          user_id: session.user.id,
          transformed_text: transformationData.transformedText,
          transformation_type: type
        });

      if (saveError) {
        console.error('Error saving transformation:', saveError);
        throw new Error(`Failed to save transformation: ${saveError.message}`);
      }

      return transformationData;
    } catch (error) {
      console.error('Error in transformText:', error);
      throw error;
    }
  }
};
