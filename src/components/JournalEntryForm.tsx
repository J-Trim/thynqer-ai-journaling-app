import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AudioRecorder from './AudioRecorder';
import { useNavigate } from 'react-router-dom';

const JournalEntryForm = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get the current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('No authenticated session found:', sessionError);
        toast({
          title: "Authentication Error",
          description: "Please sign in to create journal entries",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      console.log('Creating entry for user:', session.user.id);
      
      const { data, error } = await supabase
        .from('journal_entries')
        .insert([
          {
            title: title || 'Untitled Entry',
            text: content,
            user_id: session.user.id, // Explicitly set the user_id
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating entry:', error);
        throw error;
      }

      console.log('Entry created successfully:', data);
      
      toast({
        title: "Success",
        description: "Journal entry saved successfully",
      });

      // Clear the form
      setTitle('');
      setContent('');
      
      // Refresh the page to show the new entry
      window.location.reload();
      
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast({
        title: "Error",
        description: "Failed to save journal entry",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Entry Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full"
        />
      </div>
      <div>
        <Textarea
          placeholder="Write your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[200px] w-full"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? "Saving..." : "Save Entry"}
        </Button>
      </div>
    </form>
  );
};

export default JournalEntryForm;