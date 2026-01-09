import { create } from 'zustand'
import { CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react'

type ToastStatus = 'success' | 'error' | 'loading'

type ToastState = {
  isOpened: boolean
  text: string
  status?: ToastStatus
  duration: number
  show: (text: string, status?: ToastStatus, duration?: number) => void
  close: () => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  isOpened: false,
  text: '',
  status: undefined,
  duration: 3000,
  show: (text, status, duration = 3000) => {
    set({ isOpened: true, text, status, duration })
    if (duration > 0) {
      setTimeout(() => {
        if (get().isOpened) set({ isOpened: false })
      }, duration)
    }
  },
  close: () => set({ isOpened: false })
}))

export function showToast(text: string, status?: ToastStatus, duration?: number) {
  useToastStore.getState().show(text, status, duration)
}

export function ToastContainer() {
  const { isOpened, text, status, close } = useToastStore()

  const icon = status === 'success' ? (
    <CheckCircle className="text-white" size={20} />
  ) : status === 'error' ? (
    <AlertCircle className="text-white" size={20} />
  ) : status === 'loading' ? (
    <RefreshCw className="text-white animate-spin" size={20} />
  ) : null

  if (!isOpened) return null

  return (
    <div className="fixed inset-0 z-[1090] pointer-events-none">
      <div className="flex justify-center mt-8">
        <div
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-black/70 text-white shadow-lg"
          onClick={close}
        >
          {icon}
          <span className="text-sm">{text}</span>
        </div>
      </div>
    </div>
  )
}

type ModalState = {
  open: boolean
  title?: string
  content?: React.ReactNode
  show: (title: string, content: React.ReactNode) => void
  close: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  open: false,
  title: undefined,
  content: undefined,
  show: (title, content) => set({ open: true, title, content }),
  close: () => set({ open: false })
}))

export function showModal(title: string, content: React.ReactNode) {
  useModalStore.getState().show(title, content)
}

export function ModalContainer() {
  const { open, title, content, close } = useModalStore()
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100] p-4" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="bg-white rounded-xl w-full max-w-md shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button className="p-2 rounded-full hover:bg-gray-100" onClick={close} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          {content}
        </div>
        <div className="p-3 border-t flex justify-end">
          <button className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={close}>关闭</button>
        </div>
      </div>
    </div>
  )
}