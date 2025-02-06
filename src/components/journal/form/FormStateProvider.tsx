import React, { createContext, useContext } from 'react';
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
  setSelectedTags: (value: string[]) => void;
  showTags: boolean;
  setShowTags: (value: boolean) => void;
  transformationEnabled: boolean;
  setTransformationEnabled: (value: boolean) => void;
  lastSavedId: string | null;
  setLastSavedId: (value: string | null) => void;
}

const FormStateContext = createContext<FormStateContextType | undefined>(undefined);

export const FormStateProvider: React.FC<{ 
  children: React.ReactNode; 
  id?: string;
}> = ({ children, id }) => {
  const formState = useJournalFormState(id);

  return (
    <FormStateContext.Provider value={formState}>
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