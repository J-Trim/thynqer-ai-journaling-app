
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import TransformationItem from "./transformations/TransformationItem";

interface TransformationsListProps {
  entryId: string;
}

export const TransformationsList = ({ entryId }: TransformationsListProps) => {
  const [openStates, setOpenStates] = useState<{ [key: string]: boolean }>({});
  const [transformationToDelete, setTransformationToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: transformations, isLoading, error } = useQuery({
    queryKey: ['transformations', entryId],
    queryFn: async () => {
      console.log('Fetching transformations for entry:', entryId);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No authenticated session');
      }

      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('entry_id', entryId)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transformations:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!entryId,
  });

  // Initialize all transformations as closed when they are loaded
  useEffect(() => {
    if (transformations) {
      const initialStates = transformations.reduce((acc, transform) => ({
        ...acc,
        [transform.id]: false
      }), {});
      setOpenStates(initialStates);
    }
  }, [transformations]);

  const deleteMutation = useMutation({
    mutationFn: async (transformationId: string) => {
      console.log('Deleting transformation:', transformationId);
      const { error } = await supabase
        .from('summaries')
        .delete()
        .eq('id', transformationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transformations', entryId] });
      toast({
        description: "Transformation deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting transformation:', error);
      toast({
        variant: "destructive",
        description: "Failed to delete transformation",
      });
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        description: "Transformation copied to clipboard",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        variant: "destructive",
        description: "Failed to copy to clipboard",
      });
    }
  };

  const handleDelete = (transformationId: string) => {
    setTransformationToDelete(transformationId);
  };

  const confirmDelete = async () => {
    if (transformationToDelete) {
      await deleteMutation.mutateAsync(transformationToDelete);
      setTransformationToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    console.error('Error in transformations query:', error);
    return null;
  }

  if (!transformations?.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Transformations</h3>
      {transformations.map((transform) => (
        <TransformationItem
          key={transform.id}
          id={transform.id}
          type="Custom"
          text={transform.transformed_text}
          isOpen={openStates[transform.id]}
          onToggle={() => {
            setOpenStates(prev => ({
              ...prev,
              [transform.id]: !prev[transform.id]
            }));
          }}
          onCopy={() => copyToClipboard(transform.transformed_text)}
          onDelete={() => handleDelete(transform.id)}
        />
      ))}

      <AlertDialog open={!!transformationToDelete} onOpenChange={() => setTransformationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this transformation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this transformation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
