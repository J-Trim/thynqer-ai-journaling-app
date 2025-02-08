import React from 'react';
import { useFormState } from './FormStateProvider';
import JournalFormHeader from './JournalFormHeader';
import JournalFormContent from './JournalFormContent';
import AudioPlayer from '../AudioPlayer';
import TagSelector from '../TagSelector';
import MoodSelector from './MoodSelector';
import { TransformationManager } from '../transformations/TransformationManager';
import SaveControls from './SaveControls';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FormContentProps {
  onSave: () => Promise<{ id: string }>;
  onCancel: () => void;
  isSaving: boolean;
  isExistingEntry?: boolean;
}

const FormContent: React.FC<FormContentProps> = ({
  onSave,
  onCancel,
  isSaving,
  isExistingEntry = false,
}) => {
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
    lastSavedId,
    mood,
    setMood,
    resetForm
  } = useFormState();

  const { toast } = useToast();

  const handleAudioSaved = async (url: string) => {
    setAudioUrl(url);
    
    try {
      setIsTranscriptionPending(true);
      console.log('Starting audio transcription process for:', url);
      
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioUrl: url }
      });

      if (error) {
        console.error('Transcription error:', error);
        toast({
          title: "Transcription Failed",
          description: "Could not transcribe audio. Please try again.",
          variant: "destructive",
        });
        throw error;
      }

      if (data?.text) {
        console.log('Transcription completed successfully');
        setTranscribedAudio(data.text);
        toast({
          title: "Success",
          description: "Audio transcribed successfully",
        });
      } else {
        console.error('No transcription text received');
        toast({
          title: "Error",
          description: "No transcription text received",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Error",
        description: "Failed to process audio",
        variant: "destructive",
      });
    } finally {
      setIsTranscriptionPending(false);
    }
  };

  const {
    isRecording,
    isPaused,
    recordingTime,
    isProcessing,
    toggleRecording,
    stopRecording
  } = useAudioRecording(handleAudioSaved);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev: string[]) => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSave = async () => {
    const result = await onSave();
    if (result) {
      resetForm(); // Reset form state after successful save
    }
  };

  return (
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
        isExistingEntry={isExistingEntry}
      />
      
      <MoodSelector value={mood} onChange={setMood} />
      
      <JournalFormContent
        content={content}
        transcribedAudio={transcribedAudio}
        onContentChange={setContent}
      />

      {audioUrl && (
        <div className="mt-4">
          <AudioPlayer audioUrl={audioUrl} />
        </div>
      )}

      <TagSelector
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
        readOnly={isExistingEntry}
        className="mt-4"
      />

      {(content || transcribedAudio) && (
        <div className="mt-8">
          <TransformationManager
            entryId={lastSavedId || ''}
            entryText={content || transcribedAudio || ''}
            onSaveEntry={!lastSavedId ? onSave : undefined}
          />
        </div>
      )}

      <SaveControls
        onCancel={onCancel}
        onSave={onSave}
        isSaving={isSaving}
        isTranscriptionPending={isTranscriptionPending}
      />
    </div>
  );
};

export default FormContent;
