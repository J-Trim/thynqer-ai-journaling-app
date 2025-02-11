
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
    if (!type || !entryText?.trim()) {
      console.log('Missing required data:', { type, hasText: !!entryText?.trim() });
      return false;
    }

    setTransforming(true);
    setError(null);

    try {
      let finalEntryId = entryId;
      
      if (!entryId && onSaveEntry) {
        console.log('No entry ID found, forcing save before transformation...');
        setSaving(true);
        const savedEntry = await onSaveEntry();
        
        if (!savedEntry?.id) {
          throw new Error('Failed to save entry');
        }
        
        finalEntryId = savedEntry.id;
        setSaving(false);
      }

      const result = await transformationService.transformText(
        finalEntryId,
        entryText,
        type,
        customPrompts
      );

      setLastTransformation(result.transformedText);
      queryClient.invalidateQueries({ queryKey: ['transformations', finalEntryId] });
      
      toast({
        description: "Transformation completed successfully",
      });

      return true;
    } catch (error) {
      console.error('Error in transformation process:', error);
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
