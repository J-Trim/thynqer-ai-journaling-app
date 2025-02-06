import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import LoadingState from "./journal/LoadingState";
import AutoSave from "./journal/AutoSave";
import { useJournalSave } from "@/hooks/useJournalSave";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FormStateProvider } from "./journal/form/FormStateProvider";
import FormContent from "./journal/form/FormContent";
import AudioTranscriptionHandler from "./journal/form/AudioTranscriptionHandler";

const JournalEntryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Add query to fetch existing entry data
  const { data: existingEntry, isLoading: isLoadingEntry } = useQuery({
    queryKey: ['journal-entry', id],
    queryFn: async () => {
      console.log('Fetching existing entry:', id);
      if (!id) return null;

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching entry:', error);
        throw error;
      }

      console.log('Fetched entry data:', data);
      return data;
    },
    enabled: !!id,
  });

  const {
    isSaving,
    isSaveInProgress,
    saveEntry
  } = useJournalSave({
    title: '',
    content: '',
    audioUrl: null,
    transcribedAudio: '',
    lastSavedId: null,
    selectedTags: [],
    onSuccess: () => navigate('/journal')
  });

  const {
    isRecording,
    isPaused,
    recordingTime,
    isProcessing,
    toggleRecording,
    stopRecording
  } = useAudioRecording((url) => {
    setAudioUrl(url);
    setIsTranscriptionPending(true);
    handleAudioTranscription(url);
  });

  const cleanupAudioAndTranscription = async () => {
    if (audioUrl) {
      try {
        const { error } = await supabase.storage
          .from('audio_files')
          .remove([audioUrl]);
        
        if (error) throw error;
        
        setAudioUrl(null);
        setTranscribedAudio('');
        console.log('Audio cleanup completed successfully');
      } catch (error) {
        console.error('Error during audio cleanup:', error);
        toast({
          title: "Error",
          description: "Failed to cleanup audio files",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancel = async () => {
    await cleanupAudioAndTranscription();
    navigate("/journal");
  };

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
      <FormStateProvider id={id}>
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
            isRecording={isRecording}
            isPaused={isPaused}
            isProcessing={isProcessing}
            recordingTime={recordingTime}
            onToggleRecording={toggleRecording}
            onStopRecording={stopRecording}
            onSave={saveEntry}
            onCancel={handleCancel}
            isSaving={isSaving}
            id={id}
          />

          <AudioTranscriptionHandler
            onTranscriptionComplete={setTranscribedAudio}
            onTranscriptionStart={() => setIsTranscriptionPending(true)}
            onTranscriptionEnd={() => setIsTranscriptionPending(false)}
          />
        </div>
      </FormStateProvider>
    </div>
  );
};

export default JournalEntryForm;