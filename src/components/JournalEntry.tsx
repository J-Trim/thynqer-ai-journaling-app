import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface JournalEntryProps {
  title: string;
  date: string;
  preview: string;
}

const JournalEntry = ({ title, date, preview }: JournalEntryProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-text">{title}</CardTitle>
        <p className="text-sm text-text-muted">{date}</p>
      </CardHeader>
      <CardContent>
        <p className="text-text-muted line-clamp-2">{preview}</p>
      </CardContent>
    </Card>
  );
};

export default JournalEntry;