import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/Header";
import JournalFormHeader from "./journal/form/JournalFormHeader";
import JournalFormContent from "./journal/form/JournalFormContent";
import SaveControls from "./journal/form/SaveControls";
import LoadingState from "./journal/LoadingState";
import AutoSave from "./journal/AutoSave";
import TagSelector from "./journal/TagSelector";
import { TransformationManager } from "./journal/transformations/TransformationManager";
import { useJournalFormState } from "@/hooks/useJournalFormState";
import { useJournalSave } from "@/hooks/useJournalSave";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const JournalEntryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    title,
    setTitle,
    content,
    setContent,
    transcribedAudio,
    setTranscribedAudio,
    audioUrl,
    setAudioUrl,
    isTranscriptionPending,
    setIsTranscriptionPending,
    selectedTags,
    setSelectedTags,
    showTags,
    setShowTags,
    transformationEnabled,
    setTransformationEnabled,
    lastSavedId,
    setLastSavedId
  } = useJournalFormState(id);

  const {
    isSaving,
    isSaveInProgress,
    saveEntry
  } = useJournalSave({
    title,
    content,
    audioUrl,
    transcribedAudio,
    lastSavedId,
    selectedTags,
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

  // Navigation warning effect
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (content || title || audioUrl) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
      navigate('/');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [content, title, audioUrl, navigate]);

  const handleAudioTranscription = async (audioFileName: string) => {
    try {
      console.log('Starting audio transcription process for:', audioFileName);
      
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioUrl: audioFileName }
      });

      if (error) throw error;

      if (data?.text) {
        console.log('Transcription completed successfully');
        setTranscribedAudio(data.text);
      } else {
        throw new Error('No transcription text received');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Error",
        description: "Failed to transcribe audio",
        variant: "destructive",
      });
    } finally {
      setIsTranscriptionPending(false);
    }
  };

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

  if (!id) {
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
        
        <div className="space-y-4">
          <JournalFormHeader 
            title={title}
            onTitleChange={setTitle}
            isRecording={isRecording}
            isPaused={isPaused}
            isProcessing={isProcessing}
            recordingTime={recordingTime}
            onToggleRecording={toggleRecording}
            onStopRecording={stopRecording}
          />
          
          <JournalFormContent
            content={content}
            transcribedAudio={transcribedAudio}
            onContentChange={setContent}
          />

          <div className={`transition-opacity duration-800 ${
            showTags ? 'opacity-100' : 'opacity-0'
          }`}>
            <TagSelector
              selectedTags={selectedTags}
              onTagToggle={(tagId) => {
                setSelectedTags(prev => 
                  prev.includes(tagId)
                    ? prev.filter(id => id !== tagId)
                    : [...prev, tagId]
                );
              }}
            />
          </div>

          {(content || transcribedAudio) && (
            <div className="mt-8">
              <TransformationManager
                entryId={lastSavedId || ''}
                entryText={content || transcribedAudio || ''}
                onSaveEntry={!lastSavedId ? () => saveEntry(false) : undefined}
              />
            </div>
          )}

          <SaveControls
            onCancel={handleCancel}
            onSave={() => saveEntry(false)}
            isSaving={isSaving}
            isTranscriptionPending={isTranscriptionPending}
          />
        </div>
      </div>
    </div>
  );
};

export default JournalEntryForm;