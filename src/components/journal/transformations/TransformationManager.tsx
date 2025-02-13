
import { useCallback } from "react";
import { TransformationDialog } from "./TransformationDialog";
import { TransformationError } from "./components/TransformationError";
import { TransformationForm } from "./components/TransformationForm";
import TransformationHeader from "./components/TransformationHeader";
import TransformationButtonGroup from "./components/TransformationButtonGroup";
import { TransformationResult } from "./TransformationResult";
import { useTransformationState } from "./hooks/useTransformationState";
import { useTransformationHandlers } from "./hooks/useTransformationHandlers";
import { useCustomPrompts } from "@/hooks/useCustomPrompts";
import { Database } from "@/integrations/supabase/types";
import { TRANSFORMATION_TYPES } from "@/utils/transformationTypes";

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
    lastTransformation,
    setLastTransformation,
    lastTransformationType,
    setLastTransformationType,
    isDialogOpen,
    setIsDialogOpen,
    activeGroup,
    setActiveGroup
  } = useTransformationState();

  const { customPrompts } = useCustomPrompts();

  const { handleTransform, handleDialogOpenChange } = useTransformationHandlers({
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
  });

  const handleTransformWrapper = useCallback(() => {
    if (selectedType && entryText) {
      console.log('Starting transformation with:', {
        type: selectedType,
        textLength: entryText.length,
        entryId
      });
      return handleTransform(selectedType);
    }
    if (!entryText) {
      console.log('Transform prevented - no text provided');
      setError("Please enter some text to transform");
      return Promise.resolve(false);
    }
    return Promise.resolve(false);
  }, [handleTransform, selectedType, entryText, setError, entryId]);

  return (
    <div className="space-y-6">
      <TransformationHeader />
      
      <TransformationButtonGroup
        isDialogOpen={isDialogOpen}
        activeGroup={activeGroup}
        onOpenChange={handleDialogOpenChange}
      >
        <TransformationDialog
          group={activeGroup || ""}
          items={activeGroup ? TRANSFORMATION_TYPES[activeGroup]?.items || [] : []}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          customPrompts={customPrompts}
          onTransform={handleTransformWrapper}
          isTransforming={isTransforming}
          isSaving={isSaving}
        >
          <TransformationForm
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            onTransform={handleTransform}
            isTransforming={isTransforming}
            isSaving={isSaving}
            customPrompts={customPrompts}
            activeGroup={activeGroup}
          />
        </TransformationDialog>
      </TransformationButtonGroup>

      <TransformationError error={error} />

      <TransformationResult
        error={error}
        lastTransformation={lastTransformation}
        lastTransformationType={lastTransformationType}
        isLoading={isTransforming || isSaving}
      />
    </div>
  );
};
