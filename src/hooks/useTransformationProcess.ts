import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface TransformationProcessProps {
  entryId: string;
  entryText: string;
  onSaveEntry?: () => Promise<{ id: string } | null>;
}

export const useTransformationProcess = ({ 
  entryId, 
  entryText, 
  onSaveEntry 
}: TransformationProcessProps) => {
  const [isTransforming, setIsTransforming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleTransform = async (
    selectedType: ValidTransformation,
    customPrompts: Array<{ prompt_name: string, prompt_template: string }>,
  ) => {
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
          throw new Error('Failed to save entry');
        }
        
        finalEntryId = savedEntry.id;
        setIsSaving(false);
      }

      if (!finalEntryId) {
        throw new Error('No entry ID available');
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      const customPrompt = customPrompts.find(p => p.prompt_name === selectedType);
      console.log('Custom prompt found:', customPrompt);
      console.log('Selected transformation type:', selectedType);
      console.log('Starting transformation with entry ID:', finalEntryId);

      console.log('Starting transformation with:', {
        text: entryText,
        transformationType: selectedType,
        customTemplate: customPrompt?.prompt_template,
        entryId: finalEntryId
      });

      const { data: transformResponse, error: transformError } = await supabase.functions
        .invoke('transform-text', {
          body: { 
            text: entryText, 
            transformationType: selectedType,
            customTemplate: customPrompt?.prompt_template 
          }
        });

      if (transformError) throw transformError;

      if (!transformResponse?.transformedText) {
        throw new Error('No transformed text received');
      }

      console.log('Transform successful, saving to database...', {
        entryId: finalEntryId,
        userId: session.user.id,
        transformationType: selectedType
      });

      const { error: saveError } = await supabase
        .from('summaries')
        .insert({
          entry_id: finalEntryId,
          user_id: session.user.id,
          transformed_text: transformResponse.transformedText,
          transformation_type: selectedType,
        });

      if (saveError) throw saveError;

      console.log('Transformation saved successfully');
      queryClient.invalidateQueries({ queryKey: ['transformations', finalEntryId] });

      toast({
        description: "Transformation completed successfully",
      });

      return true;
    } catch (err) {
      console.error('Error in transformation process:', err);
      setError(err instanceof Error ? err.message : 'Failed to transform text');
      toast({
        title: "Error",
        description: "Failed to transform text. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsTransforming(false);
      setIsSaving(false);
    }
  };

  return {
    isTransforming,
    isSaving,
    error,
    handleTransform
  };
};