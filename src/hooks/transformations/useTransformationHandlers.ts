
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface UseTransformationHandlersProps {
  entryId: string;
  entryText: string;
  onSaveEntry?: () => Promise<{ id: string } | null>;
  customPrompts: Array<{ prompt_name: string; prompt_template: string }>;
  setIsDialogOpen: (open: boolean) => void;
  setActiveGroup: (group: string | null) => void;
  setError: (error: string | null) => void;
  setIsTransforming: (transforming: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setLastTransformation: (text: string | null) => void;
  setLastTransformationType: (type: string | null) => void;
}

export const useTransformationHandlers = ({
  entryId,
  entryText,
  onSaveEntry,
  customPrompts,
  setIsDialogOpen,
  setActiveGroup,
  setError,
  setIsTransforming,
  setIsSaving,
  setLastTransformation,
  setLastTransformationType,
}: UseTransformationHandlersProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleTransform = useCallback(async (type: ValidTransformation): Promise<boolean> => {
    console.log('Starting transformation with type:', type);

    if (!type || !entryText?.trim()) {
      console.log('Missing required data:', { type, hasText: !!entryText?.trim() });
      return false;
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

      const customPrompt = customPrompts.find(p => p.prompt_name === type);
      
      console.log('Calling transform-text function with:', {
        type,
        textLength: entryText.length,
        hasCustomPrompt: !!customPrompt
      });

      const { data, error: functionError } = await supabase.functions.invoke('transform-text', {
        body: { 
          text: entryText,
          transformationType: type,
          customTemplate: customPrompt?.prompt_template 
        }
      });

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw functionError;
      }

      if (!data?.transformedText) {
        console.error('No transformed text in response:', data);
        throw new Error('No transformed text received');
      }

      console.log('Transformation successful:', {
        responseLength: data.transformedText.length,
        type
      });

      setLastTransformation(data.transformedText);
      setLastTransformationType(type);

      // Invalidate transformations query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['transformations', finalEntryId] });
      
      toast({
        description: "Transformation completed successfully",
      });

      setIsDialogOpen(false);
      setActiveGroup(null);
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
  }, [entryId, entryText, onSaveEntry, queryClient, toast, setIsDialogOpen, setActiveGroup, setError, setIsTransforming, setIsSaving, customPrompts, setLastTransformation, setLastTransformationType]);

  const handleDialogOpenChange = useCallback((open: boolean, group: string) => {
    setIsDialogOpen(open);
    setActiveGroup(open ? group : null);
  }, [setIsDialogOpen, setActiveGroup]);

  return {
    handleTransform,
    handleDialogOpenChange,
  };
};
