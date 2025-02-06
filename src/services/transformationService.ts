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
    selectedType: ValidTransformation,
    customPrompts: Array<{ prompt_name: string, prompt_template: string }>,
  ) {
    console.log('Starting transformation with type:', selectedType);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const customPrompt = customPrompts.find(p => p.prompt_name === selectedType);
    const { data, error } = await supabase.functions.invoke('transform-text', {
      body: { 
        transformationType: selectedType,
        customTemplate: customPrompt?.prompt_template 
      }
    });

    if (error) throw error;
    return data;
  }
};