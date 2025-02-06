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
    return data.analysis as ComponentAnalysis;
  } catch (error) {
    console.error('Error in analyzeComponent:', error);
    throw error;
  }
};

// Let's analyze the CodeAnalysis component
const codeAnalysisComponent = {
  name: 'CodeAnalysis',
  code: `
    import { useQuery } from "@tanstack/react-query";
    import { supabase } from "@/integrations/supabase/client";
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
    import { ScrollArea } from "@/components/ui/scroll-area";

    interface AnalysisResult {
      complexity: string;
      performance: string;
      bestPractices: string;
      improvements: string;
    }

    interface CodeAnalysis {
      id: string;
      component_name: string;
      analysis_result: AnalysisResult;
      analyzed_at: string;
    }

    interface SupabaseAnalysis {
      id: string;
      component_name: string;
      analysis_result: {
        complexity: string;
        performance: string;
        bestPractices: string;
        improvements: string;
      };
      analyzed_at: string;
    }

    export const CodeAnalysis = () => {
      const { data: analyses, isLoading, error } = useQuery({
        queryKey: ['code-analysis'],
        queryFn: async () => {
          console.log('Fetching code analysis results...');
          const { data, error } = await supabase
            .from('code_analysis')
            .select('*')
            .order('analyzed_at', { ascending: false });

          if (error) {
            console.error('Error fetching analysis:', error);
            throw error;
          }

          console.log('Retrieved analyses:', data);
          
          // Type assertion and validation
          const validatedData = (data as SupabaseAnalysis[]).map(item => ({
            id: item.id,
            component_name: item.component_name,
            analysis_result: {
              complexity: item.analysis_result.complexity || '',
              performance: item.analysis_result.performance || '',
              bestPractices: item.analysis_result.bestPractices || '',
              improvements: item.analysis_result.improvements || ''
            },
            analyzed_at: item.analyzed_at
          }));

          return validatedData as CodeAnalysis[];
        }
      });

      if (isLoading) {
        return <div className="text-muted-foreground">Loading analysis results...</div>;
      }

      if (error) {
        return <div className="text-destructive">Error loading analysis results</div>;
      }

      if (!analyses?.length) {
        return <div className="text-muted-foreground">No analysis results found</div>;
      }

      return (
        <div className="space-y-6 p-4">
          <h2 className="text-2xl font-bold">Component Analysis Results</h2>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <Card key={analysis.id}>
                  <CardHeader>
                    <CardTitle>{analysis.component_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Complexity</h4>
                        <p className="text-muted-foreground">{analysis.analysis_result.complexity}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Performance</h4>
                        <p className="text-muted-foreground">{analysis.analysis_result.performance}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Best Practices</h4>
                        <p className="text-muted-foreground">{analysis.analysis_result.bestPractices}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Suggested Improvements</h4>
                        <p className="text-muted-foreground">{analysis.analysis_result.improvements}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      );
    };
  `
};

// Analyze the component
analyzeComponent(codeAnalysisComponent.name, codeAnalysisComponent.code).catch(console.error);