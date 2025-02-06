import React from "react";
import { CardContent } from "@/components/ui/card";

interface EntryPreviewProps {
  preview: string;
  audioPlayer?: React.ReactNode;
}

const EntryPreview = React.memo(({ preview, audioPlayer }: EntryPreviewProps) => {
  const displayPreview = preview?.trim() 
    ? preview 
    : "No content available";

  return (
    <CardContent>
      <p className="text-text-muted line-clamp-2">{displayPreview}</p>
      {audioPlayer && (
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          {audioPlayer}
        </div>
      )}
    </CardContent>
  );
});

EntryPreview.displayName = "EntryPreview";

export default EntryPreview;