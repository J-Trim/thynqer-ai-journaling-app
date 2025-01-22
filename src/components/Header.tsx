import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-2xl">
        <h1 
          className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors"
          onClick={() => handleNavigation("/journal")}
        >
          Thynqer
        </h1>
        <nav className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="text-text-muted hover:text-text"
            onClick={() => handleNavigation("/tags")}
          >
            Tags
          </Button>
          <Button
            variant="ghost"
            className="text-text-muted hover:text-text"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
