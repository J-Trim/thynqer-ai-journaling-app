
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

export const transformationService = {
  async improvePrompt(prompt: string) {
    console.log('Improving prompt:', prompt);
    const { data, error } = await supabase.functions.invoke('improve-prompt', {
      body: { prompt }
    });

    if (error) throw error;
    return data;
  },

  async transformText(
    entryId: string,
    entryText: string,
    selectedType: ValidTransformation,
    customPrompts: Array<{ prompt_name: string, prompt_template: string }>,
  ) {
    console.log('Starting transformation with type:', selectedType);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const customPrompt = customPrompts.find(p => p.prompt_name === selectedType);
    
    try {
      console.log('Calling transform-text function...');
      const { data, error } = await supabase.functions.invoke('transform-text', {
        body: { 
          text: entryText,
          transformationType: selectedType,
          customTemplate: customPrompt?.prompt_template 
        }
      });

      if (error) {
        console.error('Transform function error:', error);
        throw error;
      }

      if (!data?.transformedText) {
        throw new Error('No transformed text received from the service');
      }

      // Save the transformation to summaries table
      console.log('Saving transformation to summaries...');
      const { error: saveError } = await supabase
        .from('summaries')
        .insert({
          entry_id: entryId,
          user_id: session.user.id,
          transformed_text: data.transformedText,
          transformation_type: selectedType
        });

      if (saveError) {
        console.error('Error saving transformation:', saveError);
        throw saveError;
      }

      return data;
    } catch (error) {
      console.error('Transformation error:', error);
      throw error;
    }
  }
};

