import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import AudioPlayer from "./journal/AudioPlayer";
import EntryHeader from "./journal/entry/EntryHeader";
import DeleteDialog from "./journal/entry/DeleteDialog";
import { useJournalDelete } from "@/hooks/useJournalDelete";

interface JournalEntryProps {
  id: string;
  title: string;
  date: string;
  preview: string;
  audioUrl?: string | null;
  hasBeenEdited?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

const JournalEntry = React.memo(({ 
  id, 
  title, 
  date, 
  preview, 
  audioUrl,
  hasBeenEdited, 
  onClick, 
  onDelete 
}: JournalEntryProps) => {
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const { showDeleteDialog, setShowDeleteDialog, handleDelete } = useJournalDelete(onDelete);
  const cardRef = useRef<HTMLDivElement>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    // Create ResizeObserver
    if (cardRef.current) {
      resizeObserver.current = new ResizeObserver((entries) => {
        // Handle resize if needed
        console.log(`Entry ${id} resized:`, entries[0].contentRect);
      });

      // Start observing
      resizeObserver.current.observe(cardRef.current);
    }

    // Cleanup function
    return () => {
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
        resizeObserver.current = null;
      }
    };
  }, [id]);

  console.log(`JournalEntry ${id} rendered with:`, {
    title,
    preview,
    audioUrl,
    hasBeenEdited,
    previewLength: preview?.length || 0,
    isPreviewEmpty: !preview || preview.trim() === ''
  });

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleAudioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Audio button clicked for entry ${id}:`, {
      audioUrl,
      currentShowAudioPlayer: showAudioPlayer,
      willShow: !showAudioPlayer
    });
    setShowAudioPlayer(!showAudioPlayer);
  };

  const confirmDelete = async () => {
    await handleDelete(id);
  };

  // If preview is empty or undefined, show a placeholder message
  const displayPreview = preview?.trim() 
    ? preview 
    : "No content available";

  return (
    <>
      <Card 
        ref={cardRef}
        className="hover:shadow-md transition-shadow duration-200 cursor-pointer bg-white relative"
        onClick={onClick}
        role="article"
        aria-label={`Journal entry: ${title || "Untitled Entry"}`}
      >
        <EntryHeader
          title={title}
          date={date}
          hasBeenEdited={hasBeenEdited}
          hasAudio={!!audioUrl}
          onAudioClick={handleAudioClick}
          onDeleteClick={handleDeleteClick}
        />
        <CardContent>
          <p className="text-text-muted line-clamp-2">{displayPreview}</p>
          {showAudioPlayer && audioUrl && (
            <div className="mt-4" onClick={(e) => e.stopPropagation()}>
              <AudioPlayer audioUrl={audioUrl} />
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
});

JournalEntry.displayName = "JournalEntry";

export default JournalEntry;