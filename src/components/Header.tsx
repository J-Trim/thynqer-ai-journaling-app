import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, createContext } from "react";

// Create a context for managing unsaved changes
export const UnsavedChangesContext = createContext<{
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
}>({
  hasUnsavedChanges: false,
  setHasUnsavedChanges: () => {},
});

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string | null>(null);

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
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleNavigation = (path: string) => {
    // Check if we're on a journal entry page
    const isJournalEntryPage = location.pathname.includes('/journal/new') || 
                              location.pathname.includes('/journal/edit');

    if (isJournalEntryPage) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to leave?");
      if (!confirmed) {
        return;
      }
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