
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormState } from './FormStateProvider';
import JournalFormHeader from './JournalFormHeader';
import JournalFormContent from './JournalFormContent';
import AudioPlayer from '../AudioPlayer';
import TagSelector from '../../TagSelector';
import MoodSelector from './MoodSelector';
import { TransformationManager } from '../transformations/TransformationManager';
import SaveControls from './SaveControls';

interface FormContentProps {
  onSave: () => Promise<{ id: string } | null>;
  onCancel: () => void;
  isSaving: boolean;
  isExistingEntry?: boolean;
  entryId?: string;
}

const FormContent: React.FC<FormContentProps> = ({
  onSave,
  onCancel,
  isSaving,
  isExistingEntry = false,
  entryId,
}) => {
  const navigate = useNavigate();
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
    mood,
    setMood,
    resetForm
  } = useFormState();

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev: string[]) => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <div className="space-y-4">
      <JournalFormHeader 
        title={title}
        onTitleChange={setTitle}
        isExistingEntry={isExistingEntry}
      />
      
      <MoodSelector value={mood} onChange={setMood} />
      
      <JournalFormContent
        content={content}
        transcribedAudio={transcribedAudio}
        onContentChange={setContent}
        entryId={entryId}
      />

      {audioUrl && (
        <div className="mt-4">
          <AudioPlayer audioUrl={audioUrl} />
        </div>
      )}

      <TagSelector
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
        readOnly={false}
        className="mt-4"
      />

      {(content || transcribedAudio) && (
        <div className="mt-8">
          <TransformationManager
            entryId={entryId || ''}
            entryText={content || transcribedAudio || ''}
            onSaveEntry={!entryId ? onSave : undefined}
          />
        </div>
      )}

      <SaveControls
        onCancel={() => {
          resetForm();
          navigate('/journal');
        }}
        onSave={onSave}
        isSaving={isSaving}
        isTranscriptionPending={isTranscriptionPending}
      />
    </div>
  );
};

export default FormContent;
