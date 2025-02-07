
import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, AudioLines } from "lucide-react";

interface EntryHeaderProps {
  title: string;
  date: string;
  hasBeenEdited?: boolean;
  hasAudio?: boolean;
  moodIcon?: React.ReactNode;
  onAudioClick: (e: React.MouseEvent) => void;
  onDeleteClick: (e: React.MouseEvent) => void;
}

const EntryHeader = React.memo(({ 
  title, 
  date, 
  hasBeenEdited, 
  hasAudio,
  moodIcon,
  onAudioClick,
  onDeleteClick 
}: EntryHeaderProps) => {
  return (
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-medium text-text">
            {title || "Untitled Entry"}
          </CardTitle>
          {moodIcon}
        </div>
        <div className="flex items-center gap-2">
          {hasBeenEdited && (
            <Badge variant="secondary" className="ml-2">
              Edited
            </Badge>
          )}
          {hasAudio && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onAudioClick}
              className="hover:bg-secondary"
              aria-label="Toggle audio player"
            >
              <AudioLines className="h-4 w-4 text-text-muted" />
            </Button>
          )}
          <div className="relative">
            <div className="absolute -top-2 -right-2 w-8 h-8 group">
              <button
                onClick={onDeleteClick}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-secondary rounded-full absolute top-0 right-0"
                aria-label="Delete entry"
              >
                <Trash2 className="h-4 w-4 text-text-muted hover:text-destructive transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <p className="text-sm text-text-muted">{date}</p>
    </CardHeader>
  );
});

EntryHeader.displayName = "EntryHeader";

export default EntryHeader;
