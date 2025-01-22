import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { UnsavedChangesContext } from "@/contexts/UnsavedChangesContext";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { hasUnsavedChanges } = useContext(UnsavedChangesContext);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    const isJournalEntryPage = location.pathname.includes('/journal/new') || 
                              location.pathname.includes('/journal/edit');

    if (isJournalEntryPage && hasUnsavedChanges) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to leave?");
      if (!confirmed) {
        return;
      }
      toast({
        title: "Warning",
        description: "You have unsaved changes that will be lost.",
        variant: "destructive",
      });
    }

    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleNavigation = (path: string) => {
    const isJournalEntryPage = location.pathname.includes('/journal/new') || 
                              location.pathname.includes('/journal/edit');

    if (isJournalEntryPage && hasUnsavedChanges) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to leave?");
      if (!confirmed) {
        return;
      }
      toast({
        title: "Warning",
        description: "You have unsaved changes that will be lost.",
        variant: "destructive",
      });
    }
    navigate(path);
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 
          className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors"
          onClick={() => handleNavigation("/journal")}
        >
          Thynqer
        </h1>
        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="text-sm text-muted-foreground">{userEmail}</span>
          )}
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;