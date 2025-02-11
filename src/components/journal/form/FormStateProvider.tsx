
import React, { createContext, useContext, useMemo } from 'react';
import { useJournalFormState } from '@/hooks/useJournalFormState';

interface FormStateContextType {
  title: string;
  setTitle: (value: string) => void;
  content: string;
  setContent: (value: string) => void;
  transcribedAudio: string;
  setTranscribedAudio: (value: string) => void;
  audioUrl: string | null;
  setAudioUrl: (value: string | null) => void;
  isTranscriptionPending: boolean;
  setIsTranscriptionPending: (value: boolean) => void;
  selectedTags: string[];
  setSelectedTags: (value: string[] | ((prev: string[]) => string[])) => void;
  showTags: boolean;
  setShowTags: (value: boolean) => void;
  transformationEnabled: boolean;
  setTransformationEnabled: (value: boolean) => void;
  lastSavedId: string | null;
  setLastSavedId: (value: string | null) => void;
  mood: number | null;
  setMood: (value: number) => void;
  resetForm: () => void;
}

const FormStateContext = createContext<FormStateContextType | undefined>(undefined);

interface FormStateProviderProps {
  children: React.ReactNode;
  id?: string;
  initialData?: any;
}

export const FormStateProvider: React.FC<FormStateProviderProps> = ({ 
  children, 
  id,
  initialData 
}) => {
  const formState = useJournalFormState(id, initialData);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    title: formState.title,
    setTitle: formState.setTitle,
    content: formState.content,
    setContent: formState.setContent,
    transcribedAudio: formState.transcribedAudio,
    setTranscribedAudio: formState.setTranscribedAudio,
    audioUrl: formState.audioUrl,
    setAudioUrl: formState.setAudioUrl,
    isTranscriptionPending: formState.isTranscriptionPending,
    setIsTranscriptionPending: formState.setIsTranscriptionPending,
    selectedTags: formState.selectedTags,
    setSelectedTags: formState.setSelectedTags,
    showTags: formState.showTags,
    setShowTags: formState.setShowTags,
    transformationEnabled: formState.transformationEnabled,
    setTransformationEnabled: formState.setTransformationEnabled,
    lastSavedId: formState.lastSavedId,
    setLastSavedId: formState.setLastSavedId,
    mood: formState.mood,
    setMood: formState.setMood,
    resetForm: formState.resetForm
  }), [
    formState.title,
    formState.content,
    formState.transcribedAudio,
    formState.audioUrl,
    formState.isTranscriptionPending,
    formState.selectedTags,
    formState.showTags,
    formState.transformationEnabled,
    formState.lastSavedId,
    formState.mood,
    formState.setTitle,
    formState.setContent,
    formState.setTranscribedAudio,
    formState.setAudioUrl,
    formState.setIsTranscriptionPending,
    formState.setSelectedTags,
    formState.setShowTags,
    formState.setTransformationEnabled,
    formState.setLastSavedId,
    formState.setMood,
    formState.resetForm
  ]);

  return (
    <FormStateContext.Provider value={contextValue}>
      {children}
    </FormStateContext.Provider>
  );
};

export const useFormState = () => {
  const context = useContext(FormStateContext);
  if (!context) {
    throw new Error('useFormState must be used within a FormStateProvider');
  }
  return context;
};
