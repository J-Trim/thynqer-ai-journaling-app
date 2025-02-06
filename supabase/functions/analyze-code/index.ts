import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    
    if (!code) {
      throw new Error('No code provided for analysis');
    }

    console.log('Starting code analysis...');

    // Initialize analysis results
    const analysis = {
      length: code.split('\n').length,
      issues: [] as string[],
      suggestions: [] as string[],
      complexity: {
        stateVariables: 0,
        effects: 0,
        handlers: 0,
        conditionalRenders: 0
      }
    };

    // Analyze state management
    const stateMatches = code.match(/\b(useState|useReducer)\b/g) || [];
    analysis.complexity.stateVariables = stateMatches.length;
    
    if (analysis.complexity.stateVariables > 5) {
      analysis.issues.push('High number of state variables. Consider using useReducer or combining related state.');
    }

    // Analyze effects
    const effectMatches = code.match(/useEffect/g) || [];
    analysis.complexity.effects = effectMatches.length;
    
    if (analysis.complexity.effects > 3) {
      analysis.issues.push('Multiple useEffect hooks detected. Consider grouping related effects.');
    }

    // Analyze event handlers
    const handlerMatches = code.match(/handle[A-Z]\w+/g) || [];
    analysis.complexity.handlers = handlerMatches.length;
    
    if (analysis.complexity.handlers > 5) {
      analysis.issues.push('High number of event handlers. Consider grouping related functionality.');
    }

    // Analyze conditional rendering
    const conditionalMatches = code.match(/\{.*\?.*:.*\}/g) || [];
    analysis.complexity.conditionalRenders = conditionalMatches.length;
    
    if (analysis.complexity.conditionalRenders > 3) {
      analysis.issues.push('Multiple conditional renders. Consider extracting into separate components.');
    }

    // Check component length
    if (analysis.length > 200) {
      analysis.issues.push('Component is too long. Consider splitting into smaller components.');
      analysis.suggestions.push('Extract form sections into separate components');
      analysis.suggestions.push('Move complex logic into custom hooks');
    }

    // Check for prop drilling
    if (code.includes('props.') && code.match(/props\./g)?.length > 5) {
      analysis.issues.push('Potential prop drilling detected');
      analysis.suggestions.push('Consider using React Context or state management library');
    }

    // Check for accessibility
    if (!code.includes('aria-') && !code.includes('role=')) {
      analysis.issues.push('Missing accessibility attributes');
      analysis.suggestions.push('Add ARIA labels and roles for better accessibility');
    }

    // Store analysis results in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: insertError } = await supabase
      .from('code_analysis')
      .insert({
        component_name: 'JournalEntryForm',
        analysis_result: analysis,
        analyzed_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error storing analysis:', insertError);
    }

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({
        analysis,
        message: 'Code analysis completed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-code function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});