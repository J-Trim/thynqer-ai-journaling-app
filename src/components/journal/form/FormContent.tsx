import React from 'react';
import { useFormState } from './FormStateProvider';
import JournalFormHeader from './JournalFormHeader';
import JournalFormContent from './JournalFormContent';
import AudioPlayer from '../AudioPlayer';
import TagSelector from '../TagSelector';
import { TransformationManager } from '../transformations/TransformationManager';
import SaveControls from './SaveControls';

interface FormContentProps {
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  recordingTime: number;
  onToggleRecording: () => void;
  onStopRecording: () => void;
  onSave: (isAutoSave: boolean) => void;
  onCancel: () => void;
  isSaving: boolean;
  id?: string;
}

const FormContent: React.FC<FormContentProps> = ({
  isRecording,
  isPaused,
  isProcessing,
  recordingTime,
  onToggleRecording,
  onStopRecording,
  onSave,
  onCancel,
  isSaving,
  id
}) => {
  const {
    title,
    setTitle,
    content,
    setContent,
    transcribedAudio,
    audioUrl,
    isTranscriptionPending,
    selectedTags,
    setSelectedTags,
    showTags,
    lastSavedId
  } = useFormState();

  return (
    <div className="space-y-4">
      <JournalFormHeader 
        title={title}
        onTitleChange={setTitle}
        isRecording={isRecording}
        isPaused={isPaused}
        isProcessing={isProcessing}
        recordingTime={recordingTime}
        onToggleRecording={onToggleRecording}
        onStopRecording={onStopRecording}
        isExistingEntry={!!id}
      />
      
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
            onSaveEntry={!lastSavedId ? () => onSave(false) : undefined}
          />
        </div>
      )}

      <SaveControls
        onCancel={onCancel}
        onSave={() => onSave(false)}
        isSaving={isSaving}
        isTranscriptionPending={isTranscriptionPending}
      />
    </div>
  );
};

export default FormContent;