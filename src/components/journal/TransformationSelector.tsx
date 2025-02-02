import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { PenTool } from "lucide-react";
import { TransformationButton } from "./transformations/TransformationButton";
import { TransformationDialog } from "./transformations/TransformationDialog";
import { TransformationResult } from "./transformations/TransformationResult";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface TransformationSelectorProps {
  entryId: string;
  entryText: string;
  onSaveEntry?: () => Promise<{ id: string } | null>;
}

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
  const [customPrompts, setCustomPrompts] = useState<Array<{ prompt_name: string, prompt_template: string }>>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const fetchCustomPrompts = async () => {
    try {
      console.log('Fetching custom prompts...');
      const { data: prompts, error } = await supabase
        .from('custom_prompts')
        .select('prompt_name, prompt_template');

      if (error) {
        console.error('Error fetching custom prompts:', error);
        throw error;
      }

      if (prompts) {
        console.log('Custom prompts fetched:', prompts);
        setCustomPrompts(prompts);
      }
    } catch (err) {
      console.error('Error in fetchCustomPrompts:', err);
      toast({
        title: "Error",
        description: "Failed to fetch custom prompts",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCustomPrompts();
  }, []);

  useEffect(() => {
    if (isDialogOpen) {
      fetchCustomPrompts();
    }
  }, [isDialogOpen]);

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

      const customPrompt = customPrompts.find(p => p.prompt_name === selectedType);
      console.log('Custom prompt found:', customPrompt);
      console.log('Selected transformation type:', selectedType);

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
          transformation_type: selectedType as ValidTransformation,
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
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Error in transformation process:', err);
      setError(err instanceof Error ? err.message : 'Failed to transform text');
      toast({
        title: "Error",
        description: "Failed to transform text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTransforming(false);
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center mb-6">Transformation Station</h2>
      
      <div className="flex justify-center mb-8">
        <TransformationButton
          group="Custom"
          Icon={PenTool}
          isDialogOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        >
          <TransformationDialog
            group="Custom"
            items={[]}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            customPrompts={customPrompts}
            onPromptSave={fetchCustomPrompts}
            onTransform={handleTransform}
            isTransforming={isTransforming}
            isSaving={isSaving}
          />
        </TransformationButton>
      </div>

      <TransformationResult
        error={error}
        lastTransformation={lastTransformation}
        lastTransformationType={lastTransformationType}
      />
    </div>
  );
};