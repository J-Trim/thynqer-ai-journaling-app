
import { useState } from "react";
import { Database } from "@/integrations/supabase/types";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

export const useTransformationState = () => {
  const [selectedType, setSelectedType] = useState<ValidTransformation | "">("");
  const [isTransforming, setIsTransforming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTransformation, setLastTransformation] = useState<string | null>(null);
  const [lastTransformationType, setLastTransformationType] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  return {
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
    setActiveGroup,
  };
};
