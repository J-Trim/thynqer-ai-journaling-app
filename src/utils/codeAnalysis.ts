import { supabase } from "@/integrations/supabase/client";

export const analyzeCode = async (code: string, componentName: string) => {
  try {
    console.log(`Starting code analysis for ${componentName}...`);
    
    const { data, error } = await supabase.functions.invoke('analyze-code', {
      body: { code, componentName }
    });

    if (error) {
      console.error('Analysis error:', error);
      throw error;
    }

    console.log('Analysis completed:', data);
    return data;
  } catch (error) {
    console.error('Error analyzing code:', error);
    throw error;
  }
};

export const getLatestAnalysis = async (componentName: string) => {
  try {
    console.log(`Fetching latest analysis for ${componentName}...`);
    
    const { data, error } = await supabase
      .from('code_analysis')
      .select()
      .eq('component_name', componentName)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching analysis:', error);
      throw error;
    }

    console.log('Latest analysis:', data);
    return data;
  } catch (error) {
    console.error('Error getting latest analysis:', error);
    throw error;
  }
};