import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface JournalEntryProps {
  title: string;
  date: string;
  preview: string;
  hasBeenEdited?: boolean;
  onClick?: () => void;
}

const JournalEntry = ({ title, date, preview, hasBeenEdited, onClick }: JournalEntryProps) => {
  return (
    <Card 
      className="hover:shadow-md transition-shadow duration-200 cursor-pointer bg-white"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-text">{title}</CardTitle>
          {hasBeenEdited && (
            <Badge variant="secondary" className="ml-2">
              Edited
            </Badge>
          )}
        </div>
        <p className="text-sm text-text-muted">{date}</p>
      </CardHeader>
      <CardContent>
        <p className="text-text-muted line-clamp-2">{preview}</p>
      </CardContent>
    </Card>
  );
};

export default JournalEntry;