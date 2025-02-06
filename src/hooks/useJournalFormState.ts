import { useState, useEffect } from "react";

export const useJournalFormState = (id?: string, initialData?: any) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.text || "");
  const [transcribedAudio, setTranscribedAudio] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(initialData?.audio_url || null);
  const [isTranscriptionPending, setIsTranscriptionPending] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTags, setShowTags] = useState(false);
  const [transformationEnabled, setTransformationEnabled] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(id || null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setContent(initialData.text || "");
      setAudioUrl(initialData.audio_url || null);
      setLastSavedId(id || null);
    }
  }, [initialData, id]);

  return {
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
    setLastSavedId,
  };
};