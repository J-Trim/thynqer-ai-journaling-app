
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormState } from './FormStateProvider';
import JournalFormHeader from './JournalFormHeader';
import JournalFormContent from './JournalFormContent';
import AudioPlayer from '../AudioPlayer';
import TagSelector from '../../TagSelector';
import MoodSelector from './MoodSelector';
import { TransformationManager } from '../transformations/TransformationManager';
import AudioTranscriptionHandler from './AudioTranscriptionHandler';
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
  const navigate = useNavigate();
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
  };

  const handleTranscriptionComplete = (text: string) => {
    console.log('Transcription completed, setting text:', text);
    setTranscribedAudio(text);
    toast({
      title: "Transcription Complete",
      description: "Audio has been transcribed successfully",
    });
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
    try {
      const result = await onSave();
      if (result) {
        resetForm();
        navigate('/journal');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: "Error",
        description: "Failed to save journal entry",
        variant: "destructive",
      });
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

      <AudioTranscriptionHandler
        audioUrl={audioUrl}
        onTranscriptionComplete={handleTranscriptionComplete}
        onTranscriptionStart={() => setIsTranscriptionPending(true)}
        onTranscriptionEnd={() => setIsTranscriptionPending(false)}
      />

      <TagSelector
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
        readOnly={false}
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
        onCancel={() => {
          resetForm();
          navigate('/journal');
        }}
        onSave={handleSave}
        isSaving={isSaving}
        isTranscriptionPending={isTranscriptionPending}
      />
    </div>
  );
};

export default FormContent;
