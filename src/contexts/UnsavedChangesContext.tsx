import { createContext, useState, ReactNode } from "react";

export const UnsavedChangesContext = createContext<{
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
}>({
  hasUnsavedChanges: false,
  setHasUnsavedChanges: () => {},
});

interface UnsavedChangesProviderProps {
  children: ReactNode;
}

export const UnsavedChangesProvider = ({ children }: UnsavedChangesProviderProps) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  return (
    <UnsavedChangesContext.Provider value={{ hasUnsavedChanges, setHasUnsavedChanges }}>
      {children}
    </UnsavedChangesContext.Provider>
  );
};