import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useJournalEntry } from "@/hooks/useJournalEntry";
import EntryHeader from "./journal/EntryHeader";
import EntryContent from "./journal/EntryContent";
import TranscribedSection from "./journal/TranscribedSection";
import ActionButtons from "./journal/ActionButtons";
import LoadingState from "./journal/LoadingState";
import AudioHandler from "./journal/AudioHandler";
import AutoSave from "./journal/AutoSave";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const JournalEntryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    title,
    setTitle,
    content,
    setContent,
    transcribedAudio,
    audioUrl,
    setAudioUrl,
    isSaving,
    isInitializing,
    isSaveInProgress,
    hasUnsavedChanges,
    saveEntry,
    handleNavigateAway
  } = useJournalEntry(id);

  const [isTranscriptionPending, setIsTranscriptionPending] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking auth status in JournalEntryForm...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.error('Auth check error:', error);
          navigate("/auth", { replace: true });
          return;
        }

        console.log('Auth check successful, user:', session.user.id);
      } catch (error) {
        console.error('Unexpected error during auth check:', error);
        navigate("/auth", { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  const handleTranscriptionComplete = (transcribedText: string) => {
    setContent(prev => prev || ''); // Only set content if it's empty or keep existing
    setIsTranscriptionPending(false);
  };

  const AudioPlayer = ({ audioFileName }: { audioFileName: string }) => {
    const [publicUrl, setPublicUrl] = useState<string | null>(null);

    useEffect(() => {
      const fetchAudioUrl = async () => {
        try {
          const { data } = supabase.storage
            .from('audio_files')
            .getPublicUrl(audioFileName);
          
          console.log('Fetched audio URL:', data.publicUrl);
          setPublicUrl(data.publicUrl);
        } catch (error) {
          console.error('Error fetching audio URL:', error);
        }
      };

      if (audioFileName) {
        fetchAudioUrl();
      }
    }, [audioFileName]);

    if (!publicUrl) return null;

    return (
      <div className="mt-4 p-4 bg-secondary rounded-lg">
        <audio controls className="w-full">
          <source src={publicUrl} type="audio/webm" />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  };

  // Determine if recording should be allowed
  const canRecord = !id || hasUnsavedChanges;

  if (isInitializing) {
    return <LoadingState />;
  }

  const handleSave = async (isAutoSave = false) => {
    if (isTranscriptionPending) {
      console.log('Waiting for transcription to complete before saving...');
      return;
    }
    await saveEntry(isAutoSave);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
      <AutoSave
        content={content}
        title={title}
        audioUrl={audioUrl}
        isInitializing={isInitializing}
        isSaveInProgress={isSaveInProgress}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
      />
      <div className="space-y-4">
        <EntryHeader title={title} onTitleChange={setTitle} />
        <EntryContent content={content} onContentChange={setContent} />
        {transcribedAudio && <TranscribedSection transcribedAudio={transcribedAudio} />}
        {audioUrl && <AudioPlayer audioFileName={audioUrl} />}
        {canRecord && (
          <AudioHandler
            onAudioSaved={(url) => {
              setAudioUrl(url);
              setIsTranscriptionPending(true);
            }}
            onTranscriptionComplete={handleTranscriptionComplete}
          />
        )}
        <ActionButtons
          onCancel={handleNavigateAway}
          onSave={() => handleSave(false)}
          isSaving={isSaving || isTranscriptionPending}
        />
      </div>
    </div>
  );
};

export default JournalEntryForm;