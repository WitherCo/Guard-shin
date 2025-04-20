// Import the toast functionality from the UI component
import { useToast as useToastUI } from '@/components/ui/use-toast';

// Re-export the hook to use throughout the application
export const useToast = useToastUI;