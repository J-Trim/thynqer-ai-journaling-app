import { supabase } from "@/integrations/supabase/client";
import { ComponentAnalysis } from "./types";
import { getAnalysisPrompt } from "./prompts";

export const analyzeComponent = async (componentName: string, code: string) => {
  console.log(`Starting analysis for ${componentName}...`);
  
  try {
    const { data, error: analysisError } = await supabase.functions.invoke('analyze-code', {
      body: { 
        componentName,
        code,
        prompt: getAnalysisPrompt(componentName, code)
      }
    });

    if (analysisError) {
      console.error(`Error analyzing ${componentName}:`, analysisError);
      throw analysisError;
    }

    console.log(`Analysis completed for ${componentName}:`, data);
    return data.analysis as ComponentAnalysis;
  } catch (error) {
    console.error('Error in analyzeComponent:', error);
    throw error;
  }
};