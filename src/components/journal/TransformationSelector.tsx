import { Database } from "@/integrations/supabase/types";
import { TransformationButtons } from "./transformations/TransformationButtons";
import { TransformationDialog } from "./transformations/TransformationDialog";
import { TransformationResult } from "./transformations/TransformationResult";
import { useCustomPrompts } from "@/hooks/useCustomPrompts";
import { useTransformationProcess } from "@/hooks/useTransformationProcess";
import { TRANSFORMATION_TYPES } from "@/utils/transformationTypes";
import { TransformationsList } from "./TransformationsList";
import { useTransformationReducer } from "@/hooks/transformations/useTransformationReducer";

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
  const { customPrompts, fetchCustomPrompts } = useCustomPrompts();
  const { 
    state: {
      selectedType,
      isTransforming,
      isSaving,
      error,
      errorType,
      lastTransformation,
      lastTransformationType,
      isDialogOpen,
      activeGroup
    },
    setSelectedType,
    setDialog,
  } = useTransformationReducer();

  const { handleTransform } = useTransformationProcess({ 
    entryId, 
    entryText, 
    onSaveEntry 
  });

  const handleTransformationRequest = async () => {
    if (selectedType) {
      console.log('Starting transformation request with type:', selectedType);
      console.log('Entry text to transform:', entryText);
      const success = await handleTransform(selectedType, customPrompts);
      if (success) {
        console.log('Transformation completed successfully');
        setSelectedType("");
        setDialog(false, null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center mb-6">Transformation Station</h2>
      
      <TransformationButtons
        isDialogOpen={isDialogOpen}
        activeGroup={activeGroup}
        onOpenChange={(open, group) => setDialog(open, group)}
      >
        <TransformationDialog
          group={activeGroup || ""}
          items={activeGroup ? TRANSFORMATION_TYPES[activeGroup]?.items || [] : []}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          customPrompts={customPrompts}
          onPromptSave={fetchCustomPrompts}
          onTransform={handleTransformationRequest}
          isTransforming={isTransforming}
          isSaving={isSaving}
        />
      </TransformationButtons>

      <TransformationResult
        error={error}
        errorType={errorType}
        lastTransformation={lastTransformation}
        lastTransformationType={lastTransformationType}
        isLoading={isTransforming || isSaving}
      />

      <TransformationsList entryId={entryId} />
    </div>
  );
};