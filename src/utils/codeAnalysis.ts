import { supabase } from "@/integrations/supabase/client";

export const analyzeCode = async (code: string) => {
  try {
    console.log('Sending code for analysis...');
    
    const { data, error } = await supabase.functions.invoke('analyze-code', {
      body: { code }
    });

    if (error) {
      console.error('Error analyzing code:', error);
      throw error;
    }

    console.log('Analysis results:', data);
    return data.analysis;
  } catch (error) {
    console.error('Failed to analyze code:', error);
    throw error;
  }
};

export const getLatestAnalysis = async (componentName: string) => {
  try {
    const { data, error } = await supabase
      .from('code_analysis')
      .select('*')
      .eq('component_name', componentName)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching analysis:', error);
    throw error;
  }
};