import { supabase } from "@/integrations/supabase/client";

export const analyzeCode = async (code: string): Promise<string> => {
  try {
    console.log('Starting code analysis...');
    const { data, error } = await supabase.functions.invoke('analyze-code', {
      body: { code }
    });

    if (error) {
      console.error('Error analyzing code:', error);
      throw error;
    }

    console.log('Analysis completed:', data);
    return data.analysis;
  } catch (err) {
    console.error('Failed to analyze code:', err);
    throw err;
  }
};