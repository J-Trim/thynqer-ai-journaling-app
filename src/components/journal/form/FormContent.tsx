import React from 'react';
import { useFormState } from './FormStateProvider';
import JournalFormHeader from './JournalFormHeader';
import JournalFormContent from './JournalFormContent';
import AudioPlayer from '../AudioPlayer';
import TagSelector from '../TagSelector';
import { TransformationManager } from '../transformations/TransformationManager';
import SaveControls from './SaveControls';

interface FormContentProps {
  onSave: () => Promise<{ id: string }>;
  onCancel: () => void;
  isSaving: boolean;
}

const FormContent: React.FC<FormContentProps> = ({
  onSave,
  onCancel,
  isSaving,
}) => {
  const {
    title,
    content,
    transcribedAudio,
    audioUrl,
    isTranscriptionPending,
    selectedTags,
    setSelectedTags,
    showTags,
    lastSavedId
  } = useFormState();

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <div className="space-y-4">
      <JournalFormHeader title={title} />
      
      <JournalFormContent
        content={content}
        transcribedAudio={transcribedAudio}
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
          onTagToggle={handleTagToggle}
        />
      </div>

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