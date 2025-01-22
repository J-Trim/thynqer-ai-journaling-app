import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import AudioRecorder from "./AudioRecorder";

const JournalEntryForm = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to create an entry",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('journal_entries')
        .insert([
          {
            title: title || 'Untitled Entry',
            text: content,
            user_id: session.user.id,
          }
        ])
        .select();

      if (error) {
        console.error('Error creating entry:', error);
        toast({
          title: "Error",
          description: "Failed to create journal entry",
          variant: "destructive",
        });
        return;
      }

      console.log('Created entry:', data);
      toast({
        title: "Success",
        description: "Journal entry created successfully",
      });

      // Reset form
      setTitle("");
      setContent("");

      // Reload the page to show the new entry
      window.location.reload();

    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            placeholder="Entry Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-secondary/50 border-0 focus:ring-1 ring-primary/20 text-lg"
          />
        </div>
        <div>
          <Textarea
            placeholder="Write your thoughts..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px] w-full bg-secondary/50 border-0 focus:ring-1 ring-primary/20 resize-y"
          />
        </div>
        <AudioRecorder />
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting || !content.trim()}
            className="bg-primary hover:bg-primary-hover text-white transition-colors"
          >
            {isSubmitting ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default JournalEntryForm;