import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";
import { useTransformationReducer } from "./transformations/useTransformationReducer";

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
    state: { isTransforming, isSaving, error, errorType },
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

      const customPrompt = customPrompts.find(p => p.prompt_name === type);
      const url = 'https://zacanxuybdaejwjagwwe.functions.supabase.co/transform-text';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transformationType: type,
          customTemplate: customPrompt?.prompt_template 
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to transform text');
      }

      console.log('Transformation completed successfully');
      queryClient.invalidateQueries({ queryKey: ['transformations', finalEntryId] });
      
      toast({
        description: "Transformation completed successfully",
      });

      return true;
    } catch (err) {
      console.error('Error in transformation process:', err);
      const isNetworkError = err instanceof Error && err.message.includes('network');
      setError(
        err instanceof Error ? err.message : 'Failed to transform text',
        isNetworkError ? 'network' : 'server'
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
    error,
    errorType,
    handleTransform
  };
};