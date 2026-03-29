"use client"
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

type ToastType = "success" | "error" | "info"

interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  success: (msg: string | any) => void
  error: (msg: string | any) => void
  info: (msg: string | any) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const success = useCallback((msg: any) => addToast("success", typeof msg === "string" ? msg : JSON.stringify(msg)), [addToast])
  const error = useCallback((msg: any) => addToast("error", typeof msg === "string" ? msg : JSON.stringify(msg)), [addToast])
  const info = useCallback((msg: any) => addToast("info", typeof msg === "string" ? msg : JSON.stringify(msg)), [addToast])

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-3 w-80 p-4 rounded-md shadow-lg text-white font-medium animate-in slide-in-from-right-5 fade-in duration-300",
              toast.type === "success" && "bg-green-500",
              toast.type === "error" && "bg-red-500",
              toast.type === "info" && "bg-blue-500"
            )}
          >
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-white/80 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
