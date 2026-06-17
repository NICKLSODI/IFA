import { useState, useCallback, useEffect } from 'react'
import { Settings } from 'lucide-react'
import type { Case, ToastItem } from './types'
import { FUNDS as DEFAULT_FUNDS } from './types'
import { INIT_CASES } from './data/mockCases'
import { EXCEL_URL, POWER_AUTOMATE_URL } from './config/sharepoint'
import { useExcelSync } from './hooks/useExcelSync'
import CaseTable from './components/CaseTable'
import ToastStack from './components/ToastStack'
import SyncBanner from './components/SyncBanner'
import CaseDetail from './pages/CaseDetail'
import SettingsPage from './pages/SettingsPage'

type Role = 'หมู' | 'แบด' | 'แพรว' | 'ป่าน' | 'บุ๋ม' | 'บอส'
type DashTab = 'active' | 'completed'
type View =
  | { page: 'dashboard'; tab: DashTab }
  | { page: 'detail';    caseId: number }
  | { page: 'settings' }

export default function App() {
  const [role, setRole]     = useState<Role>('หมู')
  const [view, setView]     = useState<View>({ page: 'dashboard', tab: 'active' })
  // Start with mock data; replaced by Excel data once SharePoint URL is configured
  const [cases, setCases]   = useState<Case[]>((POWER_AUTOMATE_URL || EXCEL_URL) ? [] : INIT_CASES)
  const [funds, setFunds]   = useState<string[]>(DEFAULT_FUNDS)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  // ── SharePoint / Excel sync ───────────────────────────────────────────────
  const { sync, saveLocal, refetch } = useExcelSync(setCases)

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, icon = '🔔') => {
    const id = Date.now()
    setToasts(p => [...p, { id, message, icon }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500)
  }, [])

  // ── Case update (also persists to localStorage for Excel re-pulls) ────────
  const updateCase = useCallback((id: number, updates: Partial<Case>) => {
    setCases(p => p.map(c => c.id === id ? { ...c, ...updates } : c))
    saveLocal(id, updates)
  }, [saveLocal])

  // ── Slide-in animation ────────────────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slide-in { from { opacity:0; transform:translateX(-20px) } to { opacity:1; transform:translateX(0) } }
      .animate-slide-in { animation: slide-in 0.25s ease-out }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeCases    = cases.filter(c => c.status !== 'เสร็จสิ้น')
  const completedCases = cases.filter(c => c.status === 'เสร็จสิ้น')

  // ── Settings page ─────────────────────────────────────────────────────────
  if (view.page === 'settings') {
    return (
      <>
        <SettingsPage funds={funds} onFundsChange={setFunds}
          onClose={() => setView({ page: 'dashboard', tab: 'active' })} />
        <ToastStack toasts={toasts} />
      </>
    )
  }

  // ── Detail page ───────────────────────────────────────────────────────────
  if (view.page === 'detail') {
    const c = cases.find(x => x.id === view.caseId)
    if (!c) { setView({ page: 'dashboard', tab: 'active' }); return null }
    return (
      <>
        <CaseDetail c={c} role={role}
          onBack={() => setView({ page: 'dashboard', tab: 'active' })}
          onUpdate={updates => updateCase(c.id, updates)}
          showToast={showToast} />
        <ToastStack toasts={toasts} />
      </>
    )
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const tab = view.tab

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Sarabun', system-ui, sans-serif" }}>
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-4 pb-0">

          {/* Top row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2">
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                Sales Support — Fund Order Management
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">IFA Operations Center</p>
            </div>
            <div className="flex items-center gap-2 sm:mt-1 shrink-0">
              <span className="text-xs text-gray-500 hidden sm:inline">บทบาท:</span>
              <select value={role} onChange={e => setRole(e.target.value as Role)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300">
                <option>หมู</option>
                <option>แบด</option>
                <option>แพรว</option>
                <option value="ป่าน">ป่าน (Checker)</option>
                <option value="บุ๋ม">บุ๋ม (Checker)</option>
                <option value="บอส">บอส (Admin)</option>
              </select>
              <button onClick={() => setView({ page: 'settings' })} title="ตั้งค่า"
                className="w-8 h-8 flex items-center justify-center text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors">
                <Settings size={16} />
              </button>
            </div>
          </div>

          {/* Sync banner */}
          <div className="mb-3">
            <SyncBanner status={sync.status} lastSync={sync.lastSync}
              error={sync.error} onRefetch={refetch} />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {([
              { key: 'active',    label: 'งานค้าง', count: activeCases.length },
              { key: 'completed', label: 'เสร็จสิ้น', count: completedCases.length },
            ] as { key: DashTab; label: string; count: number }[]).map(t => (
              <button key={t.key} onClick={() => setView({ page: 'dashboard', tab: t.key })}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t.key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}>
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4">
        {tab === 'active'    && <CaseTable cases={activeCases}    onRowClick={c => setView({ page: 'detail', caseId: c.id })} isCompleted={false} />}
        {tab === 'completed' && <CaseTable cases={completedCases} onRowClick={c => setView({ page: 'detail', caseId: c.id })} isCompleted={true}  />}
      </main>

      <ToastStack toasts={toasts} />
    </div>
  )
}
