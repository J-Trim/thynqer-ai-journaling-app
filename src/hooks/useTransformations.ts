import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

export const useTransformations = (entryId: string) => {
  const [selectedType, setSelectedType] = useState<ValidTransformation>("Quick Summary");
  const [isTransforming, setIsTransforming] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const transformMutation = useMutation({
    mutationFn: async ({ text, type }: { text: string; type: ValidTransformation }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      console.log('Starting transformation with type:', type);

      const { data: transformResponse, error: transformError } = await supabase.functions
        .invoke('transform-text', {
          body: { 
            text, 
            transformationType: type 
          }
        });

      if (transformError) throw transformError;
      if (!transformResponse?.transformedText) {
        throw new Error('No transformed text received');
      }

      console.log('Received transformed text, saving to database...');

      const { error: saveError } = await supabase
        .from('summaries')
        .insert({
          entry_id: entryId,
          user_id: session.user.id,
          transformed_text: transformResponse.transformedText,
          transformation_type: type,
        });

      if (saveError) throw saveError;

      return transformResponse.transformedText;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transformations', entryId] });
      toast({
        description: "Text transformed successfully.",
      });
      setSelectedType("Quick Summary");
    },
    onError: (error) => {
      console.error('Error in transformation:', error);
      toast({
        description: error instanceof Error ? error.message : "Failed to transform text.",
        variant: "destructive",
      });
    }
  });

  const handleTransform = async (text: string) => {
    if (!selectedType) {
      toast({
        description: "Please select a transformation type.",
      });
      return;
    }

    if (!text?.trim()) {
      toast({
        description: "Please ensure there is text to transform.",
      });
      return;
    }

    setIsTransforming(true);
    try {
      await transformMutation.mutateAsync({ text, type: selectedType });
    } finally {
      setIsTransforming(false);
    }
  };

  return {
    selectedType,
    setSelectedType,
    isTransforming,
    handleTransform
  };
};