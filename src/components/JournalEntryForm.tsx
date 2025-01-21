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
  const [isInitializing, setIsInitializing] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth", { replace: true });
          return;
        }
      } finally {
        setIsInitializing(false);
      }
    };
    checkAuth();
  }, [navigate]);

  // Auto-save functionality
  useEffect(() => {
    if (isInitializing) return; // Don't auto-save while initializing

    const saveTimeout = setTimeout(async () => {
      if (content || title) {
        await saveEntry();
      }
    }, 3000);

    return () => clearTimeout(saveTimeout);
  }, [content, title, isInitializing]);

  const saveEntry = async () => {
    if (isInitializing) return;
    
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
      
      // Navigate after successful save
      navigate("/journal", { replace: true });
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

  if (isInitializing) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-full" />
          <div className="h-40 bg-gray-200 rounded w-full" />
          <div className="h-10 bg-gray-200 rounded w-1/4 ml-auto" />
        </div>
      </div>
    );
  }

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
            onClick={() => navigate("/journal")}
            disabled={isSaving}
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