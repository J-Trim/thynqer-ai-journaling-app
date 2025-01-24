import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import JournalList from "@/pages/JournalList";
import JournalEntryForm from "@/components/JournalEntryForm";
import TagsManagement from "@/pages/TagsManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { UnsavedChangesProvider } from "@/contexts/UnsavedChangesContext";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <UnsavedChangesProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/journal"
                  element={
                    <ProtectedRoute>
                      <JournalList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/journal/new"
                  element={
                    <ProtectedRoute>
                      <JournalEntryForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/journal/edit/:id"
                  element={
                    <ProtectedRoute>
                      <JournalEntryForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tags"
                  element={
                    <ProtectedRoute>
                      <TagsManagement />
                    </ProtectedRoute>
                  }
                />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </UnsavedChangesProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;