import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisResult {
  complexity: {
    stateCount: number;
    effectCount: number;
    handlerCount: number;
    lineCount: number;
  };
  patterns: {
    usesCustomHooks: boolean;
    usesMemo: boolean;
    usesCallback: boolean;
    usesContext: boolean;
  };
  suggestions: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, componentName } = await req.json();
    
    if (!code || !componentName) {
      throw new Error('Missing required fields: code and componentName');
    }

    console.log(`Analyzing component: ${componentName}`);

    // Basic analysis
    const analysis: AnalysisResult = {
      complexity: {
        stateCount: (code.match(/useState/g) || []).length,
        effectCount: (code.match(/useEffect/g) || []).length,
        handlerCount: (code.match(/handle[A-Z]/g) || []).length,
        lineCount: code.split('\n').length,
      },
      patterns: {
        usesCustomHooks: /use[A-Z]/.test(code),
        usesMemo: /useMemo/.test(code),
        usesCallback: /useCallback/.test(code),
        usesContext: /useContext/.test(code),
      },
      suggestions: []
    };

    // Generate suggestions based on analysis
    if (analysis.complexity.stateCount > 5) {
      analysis.suggestions.push('Consider breaking down component or using reducer for complex state');
    }
    if (analysis.complexity.effectCount > 3) {
      analysis.suggestions.push('High number of effects detected. Consider consolidating related effects');
    }
    if (analysis.complexity.lineCount > 200) {
      analysis.suggestions.push('Component is quite large. Consider splitting into smaller components');
    }
    if (!analysis.patterns.usesMemo && analysis.complexity.lineCount > 100) {
      analysis.suggestions.push('Large component might benefit from memoization');
    }

    // Store analysis in database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: insertError } = await supabaseClient
      .from('code_analysis')
      .insert({
        component_name: componentName,
        analysis_result: analysis,
      });

    if (insertError) {
      throw insertError;
    }

    console.log(`Analysis completed for ${componentName}`);

    return new Response(
      JSON.stringify(analysis),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error in analyze-code function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});