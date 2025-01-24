import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface TransformationSelectorProps {
  entryId: string;
  entryText: string;
  onSaveEntry?: () => Promise<{ id: string } | null>;
}

const TRANSFORMATION_TYPES = {
  "✨ Personal Growth": [
    'Quick Summary',
    'Emotional Check-In',
    'Daily Affirmation',
    'Mindfulness Reflection',
    'Goal Setting',
    'Short Paraphrase',
    'Psychoanalysis',
  ],
  "💼 Professional": [
    'Lesson Plan',
    'Meeting Agenda',
    'Project Proposal',
    'Action Plan',
    'Performance Review',
    'Team Update / Status Report',
    'Training Outline',
    'Sales Pitch',
    'Corporate Email / Internal Memo',
    'Project Retrospective',
    'Implementation Plan',
    'Executive Summary',
    'Brainstorm Session Outline',
    'Risk Assessment',
    'Professional White Paper',
  ],
  "🌐 Social Media": [
    'Blog Post',
    'Email',
    'Instagram Post',
    'YouTube Script',
    'X (Twitter) Post',
    'Instagram Reel / TikTok Clip',
    'Podcast Show Notes',
    'LinkedIn Article',
    'Motivational Snippet',
  ],
} as const;

export const TransformationSelector = ({ 
  entryId, 
  entryText,
  onSaveEntry,
}: TransformationSelectorProps) => {
  const [selectedType, setSelectedType] = useState<ValidTransformation | "">("");
  const [isTransforming, setIsTransforming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTransformation, setLastTransformation] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const queryClient = useQueryClient();

  const handleTransform = async () => {
    if (!selectedType || !entryText?.trim()) {
      console.log('Missing required data:', { selectedType, hasText: !!entryText?.trim() });
      return;
    }

    setIsTransforming(true);
    setError(null);

    try {
      let finalEntryId = entryId;
      
      if (!entryId && onSaveEntry) {
        console.log('No entry ID found, forcing save before transformation...');
        setIsSaving(true);
        const savedEntry = await onSaveEntry();
        
        if (!savedEntry?.id) {
          console.error('Failed to save entry:', savedEntry);
          throw new Error('Failed to save entry');
        }
        
        finalEntryId = savedEntry.id;
        console.log('Entry saved successfully with ID:', finalEntryId);
        setIsSaving(false);
      }

      if (!finalEntryId) {
        console.error('No entry ID available after save attempt');
        throw new Error('No entry ID available');
      }

      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        console.error('Authentication error:', authError);
        throw new Error('Authentication required');
      }

      console.log('Starting transformation with:', {
        text: entryText,
        transformationType: selectedType,
        entryId: finalEntryId
      });

      const { data: transformResponse, error: transformError } = await supabase.functions
        .invoke('transform-text', {
          body: { 
            text: entryText, 
            transformationType: selectedType 
          }
        });

      if (transformError) {
        console.error('Transform function error:', transformError);
        throw transformError;
      }

      if (!transformResponse?.transformedText) {
        console.error('No transformed text received from function');
        throw new Error('No transformed text received');
      }

      console.log('Transform successful, saving to database...');
      const { error: saveError } = await supabase
        .from('summaries')
        .insert({
          entry_id: finalEntryId,
          user_id: session.user.id,
          transformed_text: transformResponse.transformedText,
          transformation_type: selectedType,
        });

      if (saveError) {
        console.error('Error saving transformation:', saveError);
        throw saveError;
      }

      console.log('Transformation saved successfully');
      setLastTransformation(transformResponse.transformedText);
      setIsCollapsed(false);
      queryClient.invalidateQueries({ queryKey: ['transformations', finalEntryId] });
      setSelectedType("");
    } catch (err) {
      console.error('Error in transformation process:', err);
      setError(err instanceof Error ? err.message : 'Failed to transform text');
    } finally {
      setIsTransforming(false);
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(TRANSFORMATION_TYPES).map(([group, types]) => (
          <div key={group} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{group}</h3>
            <Select value={selectedType} onValueChange={(value: ValidTransformation) => setSelectedType(value)}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder={`Choose ${group.split(' ')[1]} Type`} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      
      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}

      <Button 
        onClick={handleTransform} 
        disabled={isTransforming || !selectedType || isSaving}
        className="w-full"
      >
        {isTransforming || isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isSaving ? 'Saving entry...' : 'Transforming...'}
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Transform
          </>
        )}
      </Button>

      {lastTransformation && (
        <Collapsible
          open={!isCollapsed}
          onOpenChange={setIsCollapsed}
          className="w-full border rounded-lg p-2"
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex justify-between items-center">
              <span>Last Transformation Result</span>
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4">
            <p className="whitespace-pre-wrap text-sm">
              {lastTransformation}
            </p>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};