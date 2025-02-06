import React, { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { TransformationButton } from "./TransformationButton";
import { TransformationDialog } from "./TransformationDialog";
import { TransformationError } from "./components/TransformationError";
import { TransformationForm } from "./components/TransformationForm";
import { useTransformationState } from "@/hooks/useTransformationState";
import { TRANSFORMATION_TYPES } from "@/utils/transformationTypes";
import { transformationService } from "./services/TransformationService";
import { Database } from "@/integrations/supabase/types";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

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
    customPrompts,
    isDialogOpen,
    setIsDialogOpen,
    activeGroup,
    setActiveGroup
  } = useTransformationState();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Memoize the transformation types to prevent unnecessary re-renders
  const transformationTypes = useMemo(() => TRANSFORMATION_TYPES, []);

  // Memoize the handle transform callback
  const handleTransform = useCallback(async (type: ValidTransformation) => {
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

      const result = await transformationService.transformText(
        finalEntryId,
        type,
        customPrompts
      );

      console.log('Transformation completed successfully');
      queryClient.invalidateQueries({ queryKey: ['transformations', finalEntryId] });
      
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
  }, [entryId, entryText, onSaveEntry, queryClient, toast, setIsDialogOpen, setActiveGroup, setError, setIsTransforming, setIsSaving, customPrompts]);

  // Memoize the dialog open change handler
  const handleDialogOpenChange = useCallback((open: boolean, group: string) => {
    setIsDialogOpen(open);
    setActiveGroup(open ? group : null);
  }, [setIsDialogOpen, setActiveGroup]);

  const handleTransformClick = useCallback(() => {
    if (selectedType) {
      handleTransform(selectedType);
    }
  }, [selectedType, handleTransform]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center mb-6">Transformation Station</h2>
      
      <div className="flex justify-center gap-8 mb-8">
        {Object.entries(transformationTypes).map(([group, { icon: Icon }]) => (
          <TransformationButton
            key={group}
            group={group}
            Icon={Icon}
            isDialogOpen={isDialogOpen && activeGroup === group}
            onOpenChange={(open) => handleDialogOpenChange(open, group)}
          >
            <TransformationDialog
              group={group}
              items={TRANSFORMATION_TYPES[group]?.items || []}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              customPrompts={customPrompts}
              onTransform={handleTransformClick}
              isTransforming={isTransforming}
              isSaving={isSaving}
            >
              <TransformationForm
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                onTransform={handleTransformClick}
                isTransforming={isTransforming}
                isSaving={isSaving}
                customPrompts={customPrompts}
                activeGroup={activeGroup}
              />
            </TransformationDialog>
          </TransformationButton>
        ))}
      </div>

      <TransformationError error={error} />
    </div>
  );
};