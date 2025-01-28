import { useState } from "react";

export const useJournalFormState = (id?: string) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [transcribedAudio, setTranscribedAudio] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscriptionPending, setIsTranscriptionPending] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTags, setShowTags] = useState(false);
  const [transformationEnabled, setTransformationEnabled] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(id || null);

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