import type { ToastItem } from '../types'

export default function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed bottom-5 left-5 flex flex-col gap-2 z-50">
      {toasts.map(t => (
        <div key={t.id} className="flex items-start gap-3 bg-gray-900 text-white rounded-xl px-4 py-3 shadow-lg max-w-xs animate-slide-in">
          <span className="text-lg flex-shrink-0">{t.icon}</span>
          <p className="text-sm leading-snug">{t.message}</p>
        </div>
      ))}
    </div>
  )
}
