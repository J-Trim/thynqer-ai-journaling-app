
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface DefaultPrompt {
  transformation_type: ValidTransformation;
  prompt_template: string;
}

export const transformationService = {
  async getDefaultPrompts(): Promise<DefaultPrompt[]> {
    const { data, error } = await supabase
      .from('default_prompts')
      .select('transformation_type, prompt_template');

    if (error) {
      console.error('Error fetching default prompts:', error);
      throw error;
    }

    return data || [];
  },

  async transformText(
    entryId: string,
    entryText: string,
    type: ValidTransformation,
    customPrompts: Array<{ prompt_name: string; prompt_template: string }>,
  ) {
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
      const { data } = await supabase
        .from('default_prompts')
        .select('prompt_template')
        .eq('transformation_type', type)
        .single();
      
      promptTemplate = data?.prompt_template || '';
    } else {
      promptTemplate = customPrompt.prompt_template;
    }

    const { data, error } = await supabase.functions.invoke('transform-text', {
      body: { 
        text: entryText,
        transformationType: type,
        customTemplate: promptTemplate 
      }
    });

    if (error) {
      throw error;
    }

    // Save the transformation to Supabase
    const { error: saveError } = await supabase
      .from('summaries')
      .insert({
        entry_id: entryId,
        user_id: session.user.id,
        transformed_text: data.transformedText,
        transformation_type: type
      });

    if (saveError) {
      throw saveError;
    }

    return data;
  }
};
