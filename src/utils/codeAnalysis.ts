import { supabase } from "@/integrations/supabase/client";

export const analyzeComponent = async (code: string, component: string) => {
  try {
    console.log(`Starting analysis of ${component}`);
    
    const { data, error } = await supabase.functions.invoke('analyze-code', {
      body: { code, component }
    });

    if (error) {
      console.error('Error analyzing code:', error);
      throw error;
    }

    console.log(`Analysis completed for ${component}`);
    return data.analysis;
  } catch (err) {
    console.error('Error in analyzeComponent:', err);
    throw err;
  }
};

export const analyzeFiles = async (files: { code: string; component: string }[]) => {
  const results = [];
  
  for (const file of files) {
    try {
      const analysis = await analyzeComponent(file.code, file.component);
      results.push({
        component: file.component,
        analysis
      });
    } catch (error) {
      console.error(`Error analyzing ${file.component}:`, error);
      results.push({
        component: file.component,
        error: error.message
      });
    }
  }
  
  return results;
};