import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

export const transformationService = {
  async transformText(
    entryId: string,
    type: ValidTransformation,
    customPrompts: Array<{ prompt_name: string; prompt_template: string }>,
  ) {
    console.log('Starting transformation with type:', type);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const customPrompt = customPrompts.find(p => p.prompt_name === type);
    const url = 'https://zacanxuybdaejwjagwwe.functions.supabase.co/transform-text';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        transformationType: type,
        customTemplate: customPrompt?.prompt_template 
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to transform text');
    }

    return response.json();
  }
};