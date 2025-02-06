
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

export const transformationService = {
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

    const customPrompt = customPrompts.find(p => p.prompt_name === type);
    const { data, error } = await supabase.functions.invoke('transform-text', {
      body: { 
        text: entryText,
        transformationType: type,
        customTemplate: customPrompt?.prompt_template 
      }
    });

    if (error) {
      throw error;
    }

    return data;
  }
};
