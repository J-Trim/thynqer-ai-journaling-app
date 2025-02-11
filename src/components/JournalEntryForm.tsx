
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import LoadingState from "./journal/LoadingState";
import AutoSave from "./journal/AutoSave";
import { useJournalSave } from "@/hooks/useJournalSave";
import { supabase } from "@/integrations/supabase/client";
import { FormStateProvider, useFormState } from "./journal/form/FormStateProvider";
import FormContent from "./journal/form/FormContent";
import AudioTranscriptionHandler from "./journal/form/AudioTranscriptionHandler";

const JournalEntryContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    title,
    content,
    audioUrl,
    transcribedAudio,
    isTranscriptionPending,
    setTranscribedAudio,
    setIsTranscriptionPending,
    selectedTags,
    lastSavedId,
  } = useFormState();

  const {
    isSaving,
    isSaveInProgress,
    saveEntry
  } = useJournalSave({
    title,
    content,
    audioUrl,
    transcribedAudio,
    lastSavedId: id || lastSavedId,
    selectedTags,
    onSuccess: () => navigate('/journal')
  });

  const handleCancel = () => {
    navigate("/journal");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
      <AutoSave
        content={content}
        title={title}
        audioUrl={audioUrl}
        isInitializing={false}
        isSaveInProgress={isSaveInProgress}
        hasUnsavedChanges={!!(content || title || audioUrl)}
        onSave={(isAutoSave) => saveEntry(isAutoSave)}
      />
      
      <FormContent
        onSave={saveEntry}
        onCancel={handleCancel}
        isSaving={isSaving}
        isExistingEntry={!!id}
        entryId={id || lastSavedId}
      />

      <AudioTranscriptionHandler
        audioUrl={audioUrl}
        onTranscriptionComplete={setTranscribedAudio}
        onTranscriptionStart={() => setIsTranscriptionPending(true)}
        onTranscriptionEnd={() => setIsTranscriptionPending(false)}
      />
    </div>
  );
};

const JournalEntryForm = () => {
  const { id } = useParams();

  const { data: existingEntry, isLoading: isLoadingEntry } = useQuery({
    queryKey: ['journal-entry', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });

  if (isLoadingEntry) {
    return (
      <>
        <Header />
        <LoadingState />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <FormStateProvider id={id} initialData={existingEntry}>
        <JournalEntryContent />
      </FormStateProvider>
    </div>
  );
};

export default JournalEntryForm;
