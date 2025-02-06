import { Reducer, useReducer } from 'react';
import { Database } from "@/integrations/supabase/types";

type ValidTransformation = Database["public"]["Enums"]["valid_transformation"];

interface TransformationState {
  selectedType: ValidTransformation | "";
  isTransforming: boolean;
  isSaving: boolean;
  error: string | null;
  errorType: 'network' | 'validation' | 'server' | 'general';
  lastTransformation: string | null;
  lastTransformationType: string | null;
  isDialogOpen: boolean;
  activeGroup: string | null;
}

type TransformationAction =
  | { type: 'SET_SELECTED_TYPE'; payload: ValidTransformation | "" }
  | { type: 'SET_TRANSFORMING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: { error: string | null; type?: 'network' | 'validation' | 'server' | 'general' } }
  | { type: 'SET_LAST_TRANSFORMATION'; payload: { text: string | null; type: string | null } }
  | { type: 'SET_DIALOG'; payload: { isOpen: boolean; group: string | null } }
  | { type: 'RESET_STATE' };

const initialState: TransformationState = {
  selectedType: "",
  isTransforming: false,
  isSaving: false,
  error: null,
  errorType: 'general',
  lastTransformation: null,
  lastTransformationType: null,
  isDialogOpen: false,
  activeGroup: null,
};

const transformationReducer: Reducer<TransformationState, TransformationAction> = (state, action) => {
  switch (action.type) {
    case 'SET_SELECTED_TYPE':
      return { ...state, selectedType: action.payload };
    case 'SET_TRANSFORMING':
      return { ...state, isTransforming: action.payload };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'SET_ERROR':
      return { 
        ...state, 
        error: action.payload.error,
        errorType: action.payload.type || 'general'
      };
    case 'SET_LAST_TRANSFORMATION':
      return { 
        ...state, 
        lastTransformation: action.payload.text,
        lastTransformationType: action.payload.type
      };
    case 'SET_DIALOG':
      return { 
        ...state, 
        isDialogOpen: action.payload.isOpen,
        activeGroup: action.payload.group
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
};

export const useTransformationReducer = () => {
  const [state, dispatch] = useReducer(transformationReducer, initialState);

  console.log('Current transformation state:', state);

  return {
    state,
    setSelectedType: (type: ValidTransformation | "") => 
      dispatch({ type: 'SET_SELECTED_TYPE', payload: type }),
    setTransforming: (isTransforming: boolean) => 
      dispatch({ type: 'SET_TRANSFORMING', payload: isTransforming }),
    setSaving: (isSaving: boolean) => 
      dispatch({ type: 'SET_SAVING', payload: isSaving }),
    setError: (error: string | null, type?: 'network' | 'validation' | 'server' | 'general') => 
      dispatch({ type: 'SET_ERROR', payload: { error, type } }),
    setLastTransformation: (text: string | null, type: string | null) => 
      dispatch({ type: 'SET_LAST_TRANSFORMATION', payload: { text, type } }),
    setDialog: (isOpen: boolean, group: string | null) => 
      dispatch({ type: 'SET_DIALOG', payload: { isOpen, group } }),
    resetState: () => dispatch({ type: 'RESET_STATE' })
  };
};