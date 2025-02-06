import { supabase } from "@/integrations/supabase/client";

interface ComponentAnalysis {
  complexity: string;
  performance: string;
  bestPractices: string;
  improvements: string;
}

export const analyzeComponent = async (componentName: string, code: string) => {
  console.log(`Starting analysis for ${componentName}...`);
  
  try {
    const { data, error } = await supabase.functions.invoke('analyze-code', {
      body: { 
        componentName,
        code 
      }
    });

    if (error) {
      console.error(`Error analyzing ${componentName}:`, error);
      throw error;
    }

    console.log(`Analysis completed for ${componentName}:`, data);
    return data.analysis;
  } catch (error) {
    console.error('Error in analyzeComponent:', error);
    throw error;
  }
};

export const analyzeJournalComponents = async () => {
  const components = [
    {
      name: 'JournalEntry',
      path: '/components/JournalEntry.tsx'
    },
    {
      name: 'AudioPlayer',
      path: '/components/journal/AudioPlayer.tsx'
    },
    {
      name: 'EntryContent',
      path: '/components/journal/EntryContent.tsx'
    },
    {
      name: 'TransformationsList',
      path: '/components/journal/TransformationsList.tsx'
    }
  ];

  console.log('Starting journal components analysis...');

  try {
    const analyses = await Promise.all(
      components.map(async (component) => {
        const analysis = await analyzeComponent(component.name, component.path);
        
        // Store analysis in database
        const { error: dbError } = await supabase
          .from('code_analysis')
          .insert([{
            component_name: component.name,
            analysis_result: analysis
          }]);

        if (dbError) {
          console.error(`Error storing analysis for ${component.name}:`, dbError);
          throw dbError;
        }

        return {
          componentName: component.name,
          analysis
        };
      })
    );

    console.log('All analyses completed:', analyses);
    return analyses;
  } catch (error) {
    console.error('Error in analyzeJournalComponents:', error);
    throw error;
  }
};

// Run the analysis
analyzeJournalComponents().catch(console.error);