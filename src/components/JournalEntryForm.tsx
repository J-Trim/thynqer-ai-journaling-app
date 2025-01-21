import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import AudioRecorder from "@/components/AudioRecorder";
import { supabase } from "@/integrations/supabase/client";

const JournalEntryForm = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Auto-save functionality
  useEffect(() => {
    const saveTimeout = setTimeout(async () => {
      if (content || title) {
        await saveEntry();
      }
    }, 3000); // Auto-save after 3 seconds of no typing

    return () => clearTimeout(saveTimeout);
  }, [content, title]);

  const saveEntry = async () => {
    try {
      setIsSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save entries",
          variant: "destructive",
        });
        return;
      }

      const entryData = {
        user_id: user.id,
        title: title || `Journal Entry - ${new Date().toLocaleDateString()}`,
        text: content,
        has_been_edited: false,
      };

      const { error } = await supabase
        .from("journal_entries")
        .insert([entryData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Journal entry saved successfully",
      });
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({
        title: "Error",
        description: "Failed to save journal entry",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-semibold"
        />
        <Textarea
          placeholder="Start writing your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[200px] resize-y"
        />
        <AudioRecorder />
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
          >
            Cancel
          </Button>
          <Button
            onClick={saveEntry}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JournalEntryForm;