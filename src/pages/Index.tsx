import React, { useState, useEffect } from "react";
import AudioRecorder from "@/components/AudioRecorder";
import JournalEntry from "@/components/JournalEntry";
import Header from "@/components/Header";
import JournalEntryForm from "@/components/JournalEntryForm";

const LoadingScreen = () => (
  <div className="min-h-screen bg-background animate-fade-in">
    <Header />
    <main className="container mx-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-muted-foreground animate-pulse">Loading your journal...</div>
        </div>
      </div>
    </main>
  </div>
);

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Simulate a minimum loading time for smooth transition
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Add a small delay before showing content
      setTimeout(() => setShowContent(true), 300);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !showContent) {
    return <LoadingScreen />;
  }

  const sampleEntries = [
    {
      title: "Morning Reflection",
      date: "March 19, 2024",
      preview: "Today started with a beautiful sunrise. I took a moment to appreciate the quiet morning and set my intentions for the day..."
    },
    {
      title: "Afternoon Thoughts",
      date: "March 18, 2024",
      preview: "Had an interesting conversation with Sarah about the future of our project. We discussed several new approaches..."
    },
  ];

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold">Journal Entry</h2>
            <p className="text-muted-foreground">Capture your thoughts with text and voice</p>
          </div>

          <JournalEntryForm />

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Recent Entries</h2>
            <div className="space-y-4">
              {sampleEntries.map((entry, index) => (
                <JournalEntry
                  key={index}
                  title={entry.title}
                  date={entry.date}
                  preview={entry.preview}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;