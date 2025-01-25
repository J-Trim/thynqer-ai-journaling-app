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
import { 
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, FileText, User, Briefcase, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface TransformationSelectorProps {
  entryId: string;
  entryText: string;
  onSaveEntry?: () => Promise<{ id: string } | null>;
}

const TRANSFORMATION_TYPES = {
  "Personal Growth": {
    icon: User,
    items: [
      'Quick Summary',
      'Emotional Check-In',
      'Daily Affirmation',
      'Mindfulness Reflection',
      'Goal Setting',
      'Short Paraphrase',
      'Psychoanalysis',
    ]
  },
  "Professional": {
    icon: Briefcase,
    items: [
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
    ]
  },
  "Social Media": {
    icon: Share2,
    items: [
      'Blog Post',
      'Email',
      'Instagram Post',
      'YouTube Script',
      'X (Twitter) Post',
      'Instagram Reel / TikTok Clip',
      'Podcast Show Notes',
      'LinkedIn Article',
      'Motivational Snippet',
    ]
  },
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
  const [lastTransformationType, setLastTransformationType] = useState<string | null>(null);
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
      setLastTransformationType(selectedType);
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
      <h2 className="text-xl font-semibold text-center mb-6">Transformation Station</h2>
      
      <div className="flex justify-center gap-8 mb-8">
        {Object.entries(TRANSFORMATION_TYPES).map(([group, { icon: Icon, items }]) => (
          <Dialog key={group}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="lg"
                className="flex flex-col items-center gap-2 p-4 hover:bg-secondary transition-colors"
              >
                <Icon className="h-8 w-8" />
                <span className="text-sm font-medium">{group}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md animate-fade-in">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{group}</h3>
                <Select value={selectedType} onValueChange={(value: ValidTransformation) => setSelectedType(value)}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder={`Choose ${group} Type`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {items.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </DialogContent>
          </Dialog>
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

      {lastTransformation && lastTransformationType && (
        <div className="w-full border rounded-lg p-4 mt-4 animate-fade-in">
          <h4 className="font-medium mb-2">{lastTransformationType}</h4>
          <p className="whitespace-pre-wrap text-sm">
            {lastTransformation}
          </p>
        </div>
      )}
    </div>
  );
};
