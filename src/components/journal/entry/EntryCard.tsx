import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface EntryCardProps {
  id: string;
  title: string;
  preview: string;
  onClick?: () => void;
  children: React.ReactNode;
}

const EntryCard = React.memo(({ 
  id, 
  title, 
  preview, 
  onClick, 
  children 
}: EntryCardProps) => {
  return (
    <Card 
      className="hover:shadow-md transition-shadow duration-200 cursor-pointer bg-white relative"
      onClick={onClick}
      role="article"
      aria-label={`Journal entry: ${title || "Untitled Entry"}`}
    >
      {children}
    </Card>
  );
});

EntryCard.displayName = "EntryCard";

export default EntryCard;