import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import JournalList from "@/pages/JournalList";
import JournalEntryForm from "@/components/JournalEntryForm";
import TagsManagement from "@/pages/TagsManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { UnsavedChangesProvider } from "@/contexts/UnsavedChangesContext";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UnsavedChangesProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/journal" replace />} />
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
        </Router>
      </UnsavedChangesProvider>
    </QueryClientProvider>
  );
}

export default App;