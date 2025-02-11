
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";
import { useTransformationReducer } from "./transformations/useTransformationReducer";
import { transformationService } from "@/services/transformationService";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface UseTransformationProcessProps {
  entryId: string;
  entryText: string;
  onSaveEntry?: () => Promise<{ id: string } | null>;
}

export const useTransformationProcess = ({
  entryId,
  entryText,
  onSaveEntry,
}: UseTransformationProcessProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    state: { isTransforming, isSaving },
    setTransforming,
    setSaving,
    setError,
    setLastTransformation,
  } = useTransformationReducer();

  const handleTransform = async (
    type: ValidTransformation,
    customPrompts: Array<{ prompt_name: string; prompt_template: string }>
  ) => {
    console.log('Starting transformation process:', {
      type,
      entryId,
      textLength: entryText?.length,
      hasCustomPrompts: customPrompts?.length > 0
    });

    if (!type || !entryText?.trim()) {
      console.log('Missing required data:', { 
        type, 
        hasText: !!entryText?.trim(),
        textLength: entryText?.length 
      });
      return false;
    }

    console.log('Setting transforming state to true');
    setTransforming(true);
    setError(null);

    // Declare finalEntryId outside try block so it's accessible in catch
    let finalEntryId = entryId;

    try {
      // If no entry ID exists, save the entry first
      if (!entryId && onSaveEntry) {
        console.log('No entry ID found, forcing save before transformation...', {
          currentEntryId: entryId,
          hasCallback: !!onSaveEntry
        });
        setSaving(true);
        const savedEntry = await onSaveEntry();
        
        if (!savedEntry?.id) {
          console.error('Failed to save entry:', savedEntry);
          throw new Error('Failed to save entry');
        }
        
        console.log('Entry saved successfully:', {
          newEntryId: savedEntry.id,
          originalEntryId: entryId
        });
        
        finalEntryId = savedEntry.id;
        setSaving(false);
      }

      console.log('Calling transformation service with:', {
        finalEntryId,
        textLength: entryText.length,
        type,
        customPromptsCount: customPrompts.length
      });

      // Use transformationService to handle the transformation
      const result = await transformationService.transformText(
        finalEntryId,
        entryText,
        type,
        customPrompts
      );

      console.log('Transformation result received:', {
        transformedTextLength: result.transformedText.length,
        type: result.type,
        success: !!result.transformedText
      });

      console.log('Setting last transformation:', {
        textPreview: result.transformedText.substring(0, 50) + '...',
        type: result.type
      });
      setLastTransformation(result.transformedText, result.type);
      
      // Log query invalidation
      console.log('Current query data before invalidation:', {
        queryKey: ['transformations', finalEntryId],
        data: queryClient.getQueryData(['transformations', finalEntryId])
      });
      
      console.log('Invalidating queries for entry:', finalEntryId);
      // Invalidate and refetch
      await queryClient.invalidateQueries({ 
        queryKey: ['transformations', finalEntryId],
        refetchType: 'active'
      });
      
      console.log('Query invalidation complete, checking new data:', {
        queryKey: ['transformations', finalEntryId],
        newData: queryClient.getQueryData(['transformations', finalEntryId])
      });
      
      toast({
        description: "Transformation completed successfully",
      });

      return true;
    } catch (error) {
      console.error('Error in transformation process:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        entryId: finalEntryId,
        type
      });
      setError(
        error instanceof Error ? error.message : 'Failed to transform text'
      );
      toast({
        title: "Error",
        description: "Failed to transform text. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      console.log('Cleaning up transformation process...', {
        isTransforming,
        isSaving
      });
      setTransforming(false);
      setSaving(false);
    }
  };

  return {
    isTransforming,
    isSaving,
    handleTransform
  };
};
