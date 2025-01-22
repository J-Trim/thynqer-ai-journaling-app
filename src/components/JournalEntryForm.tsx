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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking auth status in JournalEntryForm...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth check error:', error);
          toast({
            title: "Authentication Error",
            description: "Please try logging in again",
            variant: "destructive",
          });
          navigate("/auth", { replace: true });
          return;
        }

        if (!session) {
          console.log('No session found, redirecting to auth');
          navigate("/auth", { replace: true });
          return;
        }

        console.log('Auth check successful, user:', session.user.id);
      } catch (error) {
        console.error('Unexpected error during auth check:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
      } finally {
        setIsInitializing(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  useEffect(() => {
    if (isInitializing) return;

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
      console.log('Attempting to save entry...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }

      if (!user) {
        console.log('No user found, redirecting to auth');
        throw new Error('You must be logged in to save entries');
      }

      const entryData = {
        user_id: user.id,
        title: title || `Journal Entry - ${new Date().toLocaleDateString()}`,
        text: content,
        has_been_edited: false,
      };

      console.log('Saving entry data:', { ...entryData, text: content.length + ' chars' });

      const { error: saveError } = await supabase
        .from("journal_entries")
        .insert([entryData]);

      if (saveError) {
        console.error('Error saving entry:', saveError);
        throw saveError;
      }

      console.log('Entry saved successfully');
      toast({
        title: "Success",
        description: "Journal entry saved successfully",
      });
      
      navigate("/journal", { replace: true });
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save journal entry",
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
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
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