import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Check, X, AlertCircle, Info } from "lucide-react"

const getToastIcon = (variant?: "default" | "destructive") => {
  switch (variant) {
    case "destructive":
      return <AlertCircle className="h-4 w-4 text-destructive" />
    case "default":
      return <Check className="h-4 w-4 text-primary" />
    default:
      return <Info className="h-4 w-4 text-primary" />
  }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, variant, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props} 
            className="min-h-0 p-2 flex items-center gap-2 bg-background/80 backdrop-blur-sm border border-border/50"
          >
            {getToastIcon(variant)}
            <div className="flex flex-col gap-1">
              {title && <ToastTitle className="text-sm">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-xs text-muted-foreground">
                  {description}
                </ToastDescription>
              )}
            </div>
            <ToastClose className="absolute right-1 top-1 opacity-70 transition-opacity hover:opacity-100" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}