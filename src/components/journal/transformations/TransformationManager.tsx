import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TransformationButton } from "./TransformationButton";
import { TransformationDialog } from "./TransformationDialog";
import { TransformationResult } from "./TransformationResult";
import { useTransformationState } from "@/hooks/useTransformationState";
import { TRANSFORMATION_TYPES } from "@/utils/transformationTypes";

interface TransformationManagerProps {
  entryId: string;
  entryText: string;
  onSaveEntry?: () => Promise<{ id: string } | null>;
}

export const TransformationManager = ({
  entryId,
  entryText,
  onSaveEntry
}: TransformationManagerProps) => {
  const {
    selectedType,
    setSelectedType,
    isTransforming,
    setIsTransforming,
    isSaving,
    setIsSaving,
    error,
    setError,
    lastTransformation,
    setLastTransformation,
    lastTransformationType,
    setLastTransformationType,
    customPrompts,
    setCustomPrompts,
    isDialogOpen,
    setIsDialogOpen,
    activeGroup,
    setActiveGroup
  } = useTransformationState();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const fetchCustomPrompts = async () => {
    try {
      console.log('Fetching custom prompts...');
      const { data: prompts, error } = await supabase
        .from('custom_prompts')
        .select('prompt_name, prompt_template');

      if (error) throw error;
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
    if (isDialogOpen && activeGroup === "Custom") {
      fetchCustomPrompts();
    }
  }, [isDialogOpen, activeGroup]);

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
      console.log('Starting transformation with text:', entryText);

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

      console.log('Transform successful, saving to database...');
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
      setLastTransformation(transformResponse.transformedText);
      setLastTransformationType(selectedType);
      queryClient.invalidateQueries({ queryKey: ['transformations', finalEntryId] });
      setSelectedType("");
      setIsDialogOpen(false);
      setActiveGroup(null);
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
      
      <div className="flex justify-center gap-8 mb-8">
        {Object.entries(TRANSFORMATION_TYPES).map(([group, { icon: Icon, items }]) => (
          <TransformationButton
            key={group}
            group={group}
            Icon={Icon}
            isDialogOpen={isDialogOpen && activeGroup === group}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              setActiveGroup(open ? group : null);
            }}
          >
            <TransformationDialog
              group={group}
              items={items}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              customPrompts={customPrompts}
              onPromptSave={fetchCustomPrompts}
              onTransform={handleTransform}
              isTransforming={isTransforming}
              isSaving={isSaving}
            />
          </TransformationButton>
        ))}
      </div>

      <TransformationResult
        error={error}
        lastTransformation={lastTransformation}
        lastTransformationType={lastTransformationType}
      />
    </div>
  );
};