import { supabase } from "@/integrations/supabase/client";

export const analyzeComponent = async (code: string) => {
  try {
    console.log('Starting code analysis...');
    
    const { data, error } = await supabase.functions.invoke('analyze-code', {
      body: { code }
    });

    if (error) {
      console.error('Analysis error:', error);
      throw error;
    }

    console.log('Analysis completed successfully');
    return data.analysis;
  } catch (err) {
    console.error('Failed to analyze code:', err);
    throw err;
  }
};

export const analyzeFiles = async (files: { name: string; content: string }[]) => {
  const results = [];
  
  for (const file of files) {
    try {
      console.log(`Analyzing ${file.name}...`);
      const analysis = await analyzeComponent(file.content);
      results.push({
        fileName: file.name,
        analysis
      });
    } catch (err) {
      console.error(`Failed to analyze ${file.name}:`, err);
      results.push({
        fileName: file.name,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }
  
  return results;
};