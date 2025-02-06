import { supabase } from "@/integrations/supabase/client";

export async function analyzeComponent(code: string, componentName: string) {
  try {
    console.log(`Starting analysis for ${componentName}...`);
    
    const { data, error } = await supabase.functions.invoke('analyze-code', {
      body: { code, component: componentName }
    });

    if (error) {
      console.error(`Error analyzing ${componentName}:`, error);
      throw error;
    }

    console.log(`Analysis completed for ${componentName}`);
    return data.analysis;
  } catch (error) {
    console.error(`Failed to analyze ${componentName}:`, error);
    throw error;
  }
}

export async function analyzeFiles(files: { code: string; name: string }[]) {
  const results = [];
  
  for (const file of files) {
    try {
      const analysis = await analyzeComponent(file.code, file.name);
      results.push({
        name: file.name,
        analysis
      });
    } catch (error) {
      console.error(`Error analyzing ${file.name}:`, error);
      results.push({
        name: file.name,
        error: error.message
      });
    }
  }
  
  return results;
}