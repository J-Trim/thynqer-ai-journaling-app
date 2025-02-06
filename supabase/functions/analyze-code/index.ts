import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('Missing OpenAI API key');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const component = `
    import React, { useState, useEffect, useRef } from "react";
    import { Card, CardContent } from "@/components/ui/card";
    import AudioPlayer from "./journal/AudioPlayer";
    import EntryHeader from "./journal/entry/EntryHeader";
    import DeleteDialog from "./journal/entry/DeleteDialog";
    import { useJournalDelete } from "@/hooks/useJournalDelete";

    interface JournalEntryProps {
      id: string;
      title: string;
      date: string;
      preview: string;
      audioUrl?: string | null;
      hasBeenEdited?: boolean;
      onClick?: () => void;
      onDelete?: () => void;
    }

    const JournalEntry = React.memo(({ 
      id, 
      title, 
      date, 
      preview, 
      audioUrl,
      hasBeenEdited, 
      onClick, 
      onDelete 
    }: JournalEntryProps) => {
      const [showAudioPlayer, setShowAudioPlayer] = useState(false);
      const { showDeleteDialog, setShowDeleteDialog, handleDelete } = useJournalDelete(onDelete);
      const cardRef = useRef<HTMLDivElement>(null);
      const resizeObserver = useRef<ResizeObserver | null>(null);

      useEffect(() => {
        if (cardRef.current) {
          resizeObserver.current = new ResizeObserver((entries) => {
            console.log(\`Entry \${id} resized:\`, entries[0].contentRect);
          });

          resizeObserver.current.observe(cardRef.current);
        }

        return () => {
          if (resizeObserver.current) {
            resizeObserver.current.disconnect();
            resizeObserver.current = null;
          }
        };
      }, [id]);

      console.log(\`JournalEntry \${id} rendered with:\`, {
        title,
        preview,
        audioUrl,
        hasBeenEdited,
        previewLength: preview?.length || 0,
        isPreviewEmpty: !preview || preview.trim() === ''
      });

      const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteDialog(true);
      };

      const handleAudioClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log(\`Audio button clicked for entry \${id}:\`, {
          audioUrl,
          currentShowAudioPlayer: showAudioPlayer,
          willShow: !showAudioPlayer
        });
        setShowAudioPlayer(!showAudioPlayer);
      };

      const confirmDelete = async () => {
        await handleDelete(id);
      };

      const displayPreview = preview?.trim() 
        ? preview 
        : "No content available";

      return (
        <>
          <Card 
            ref={cardRef}
            className="hover:shadow-md transition-shadow duration-200 cursor-pointer bg-white relative"
            onClick={onClick}
            role="article"
            aria-label={\`Journal entry: \${title || "Untitled Entry"}\`}
          >
            <EntryHeader
              title={title}
              date={date}
              hasBeenEdited={hasBeenEdited}
              hasAudio={!!audioUrl}
              onAudioClick={handleAudioClick}
              onDeleteClick={handleDeleteClick}
            />
            <CardContent>
              <p className="text-text-muted line-clamp-2">{displayPreview}</p>
              {showAudioPlayer && audioUrl && (
                <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                  <AudioPlayer audioUrl={audioUrl} />
                </div>
              )}
            </CardContent>
          </Card>

          <DeleteDialog
            isOpen={showDeleteDialog}
            onClose={() => setShowDeleteDialog(false)}
            onConfirm={confirmDelete}
          />
        </>
      );
    });

    JournalEntry.displayName = "JournalEntry";

    export default JournalEntry;
    `;

    const prompt = `Analyze this React JournalEntry component and provide detailed feedback in JSON format. Focus on:
1. Code complexity and potential simplifications
2. Performance optimizations
3. React best practices and potential improvements
4. Accessibility considerations
5. State management
6. Error handling
7. Component organization

Format your response as a JSON object with these exact keys:
{
  "complexity": string,
  "performance": string,
  "bestPractices": string,
  "improvements": string[]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert React developer analyzing code for improvements. Provide detailed, actionable feedback.' 
          },
          { 
            role: 'user', 
            content: prompt + "\n\nComponent code:\n" + component
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API error: ' + await response.text());
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    console.log('Analysis received:', analysis);

    // Store the analysis in the database
    const { error: dbError } = await supabase
      .from('code_analysis')
      .insert({
        component_name: 'JournalEntry',
        analysis_result: JSON.parse(analysis)
      });

    if (dbError) {
      throw new Error('Database error: ' + dbError.message);
    }

    return new Response(analysis, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-code function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});