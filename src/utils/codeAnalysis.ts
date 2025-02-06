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

export const analyzeFiles = async (files: { name: string; content: string }[]): Promise<{ name: string; analysis: string }[]> => {
  const results = [];
  
  for (const file of files) {
    try {
      console.log(`Analyzing ${file.name}...`);
      const analysis = await analyzeCode(file.content);
      results.push({
        name: file.name,
        analysis
      });
    } catch (error) {
      console.error(`Error analyzing ${file.name}:`, error);
      results.push({
        name: file.name,
        analysis: `Error analyzing file: ${error.message}`
      });
    }
  }
  
  return results;
};