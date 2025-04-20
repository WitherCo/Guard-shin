import * as React from "react"

// Define the toast context type
type ToastContextType = {
  toasts: Toast[]
  toast: (props: ToastProps) => void
  dismissToast: (id: string) => void
}

// Create the toast context
const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
)

// Define Toast types
export type ToastProps = {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

type Toast = ToastProps & {
  id: string
}

// Create a unique ID for each toast
let toastId = 0
function generateId() {
  return `toast-${toastId++}`
}

// Create the toast provider
export function ToastProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  // Function to add a toast
  const toast = React.useCallback(
    (props: ToastProps) => {
      const id = props.id || generateId()
      
      setToasts((prevToasts) => {
        // Check if toast with same ID already exists
        if (prevToasts.find((t) => t.id === id)) {
          return prevToasts.map((t) =>
            t.id === id ? { ...t, ...props, id } : t
          )
        }
        
        return [...prevToasts, { ...props, id }]
      })
      
      // Automatically dismiss toast after 5 seconds
      setTimeout(() => {
        dismissToast(id)
      }, 5000)
      
      return id
    },
    []
  )

  // Function to dismiss a toast
  const dismissToast = React.useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id))
  }, [])

  const value = React.useMemo(
    () => ({ toasts, toast, dismissToast }),
    [toasts, toast, dismissToast]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

// Hook to use the toast context
export function useToast() {
  const context = React.useContext(ToastContext)
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  
  return context
}