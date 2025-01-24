import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, variant, ...props }) {
        let Icon = Info
        if (variant === "destructive") {
          Icon = AlertCircle
        } else if (description?.toString().toLowerCase().includes("success")) {
          Icon = CheckCircle2
        }

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="grid gap-1">
              <ToastTitle>
                <Icon className="h-4 w-4" />
                {title}
              </ToastTitle>
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}