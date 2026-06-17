import { RefreshCw, CheckCircle2, AlertCircle, Loader2, Settings2 } from 'lucide-react'
import type { SyncStatus } from '../hooks/useExcelSync'

interface Props {
  status:   SyncStatus
  lastSync: Date | null
  error:    string | null
  onRefetch: () => void
}

function timeAgo(d: Date): string {
  const s = Math.round((Date.now() - d.getTime()) / 1000)
  if (s < 60)  return `${s}s ที่แล้ว`
  if (s < 3600) return `${Math.floor(s / 60)}m ที่แล้ว`
  return `${Math.floor(s / 3600)}h ที่แล้ว`
}

export default function SyncBanner({ status, lastSync, error, onRefetch }: Props) {
  if (status === 'unconfigured') {
    return (
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-xs">
        <Settings2 size={13} className="shrink-0" />
        <span>
          ยังไม่ได้เชื่อมต่อ SharePoint — กำหนด <code className="font-mono bg-amber-100 px-1 rounded">EXCEL_URL</code> ใน{' '}
          <code className="font-mono bg-amber-100 px-1 rounded">src/config/sharepoint.ts</code>
        </span>
        <span className="ml-1 text-amber-500">(กำลังใช้ข้อมูลตัวอย่าง)</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2 text-xs">
        <AlertCircle size={13} className="shrink-0" />
        <span className="flex-1">ดึงข้อมูลไม่ได้: {error}</span>
        <button onClick={onRefetch}
          className="flex items-center gap-1 px-2 py-1 bg-rose-100 hover:bg-rose-200 rounded-md transition-colors">
          <RefreshCw size={11} /> ลองใหม่
        </button>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-xs">
        <Loader2 size={13} className="animate-spin shrink-0" />
        กำลังดึงข้อมูลจาก SharePoint…
      </div>
    )
  }

  if (status === 'ok' && lastSync) {
    return (
      <div className="flex items-center gap-1.5 text-gray-400 text-xs">
        <CheckCircle2 size={12} className="text-green-500 shrink-0" />
        <span>ซิงค์ล่าสุด {timeAgo(lastSync)}</span>
        <button onClick={onRefetch}
          className="ml-1 text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw size={11} />
        </button>
      </div>
    )
  }

  return null
}
