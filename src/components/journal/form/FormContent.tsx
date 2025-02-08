
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
    
    try {
      setIsTranscriptionPending(true);
      console.log('Starting audio transcription process for:', url);
      
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      // Create transcription job
      const { data: jobData, error: queueError } = await supabase
        .from('transcription_queue')
        .insert({
          audio_url: url,
          user_id: session.user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (queueError) {
        throw queueError;
      }

      // Start polling for transcription result
      const pollInterval = setInterval(async () => {
        const { data: result, error: pollError } = await supabase
          .from('transcription_queue')
          .select('status, result, error')
          .eq('id', jobData.id)
          .single();

        if (pollError) {
          clearInterval(pollInterval);
          throw pollError;
        }

        if (result.status === 'completed' && result.result) {
          clearInterval(pollInterval);
          setTranscribedAudio(result.result);
          toast({
            title: "Success",
            description: "Audio transcribed successfully",
          });
          setIsTranscriptionPending(false);
        } else if (result.status === 'failed') {
          clearInterval(pollInterval);
          throw new Error(result.error || 'Transcription failed');
        }
      }, 5000); // Poll every 5 seconds

      // Cleanup polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isTranscriptionPending) {
          setIsTranscriptionPending(false);
          toast({
            title: "Timeout",
            description: "Transcription is taking longer than expected. Please try again.",
            variant: "destructive",
          });
        }
      }, 300000); // 5 minutes timeout

    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process audio",
        variant: "destructive",
      });
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
