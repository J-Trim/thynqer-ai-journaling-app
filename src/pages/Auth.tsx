import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { AuthError, AuthApiError } from "@supabase/supabase-js";

const AuthPage = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthPage] Auth state changed:', event, session);
        if (event === "SIGNED_IN" && session) {
          navigate("/journal");
        }
        if (event === "USER_UPDATED") {
          const { error } = await supabase.auth.getSession();
          if (error) {
            console.error('[AuthPage] Session error:', error);
            setErrorMessage(getErrorMessage(error));
          }
        }
        if (event === "SIGNED_OUT") {
          setErrorMessage("");
        }
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[AuthPage] Initial session check:', session ? 'Authenticated' : 'Not authenticated');
      if (error) {
        console.error('[AuthPage] Initial session error:', error);
        setErrorMessage(getErrorMessage(error));
      } else if (session) {
        navigate("/journal");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const getErrorMessage = (error: AuthError) => {
    console.error('[AuthPage] Auth error:', error);
    
    if (error instanceof AuthApiError) {
      switch (error.status) {
        case 400:
          if (error.message.includes("missing email")) {
            return "Please enter your email address.";
          }
          if (error.message.includes("password")) {
            return "Please enter your password.";
          }
          return "Please check your login credentials and try again.";
        case 401:
          return "Invalid credentials. Please check your email and password.";
        case 422:
          return "Invalid email format. Please enter a valid email address.";
        default:
          return error.message;
      }
    }
    return error.message;
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">Welcome to Thynqer</h1>
          <p className="text-muted-foreground mt-2">Your AI-powered journaling companion</p>
        </div>
        
        {errorMessage && (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="bg-card p-6 rounded-lg shadow-lg">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'rgb(var(--primary))',
                    brandAccent: 'rgb(var(--primary))',
                  },
                },
              },
              className: {
                container: 'animate-fade-in',
                button: 'animate-fade-in',
                input: 'animate-fade-in',
              },
            }}
            providers={[]}
          />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;