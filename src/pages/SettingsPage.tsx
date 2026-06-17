import { useState } from 'react'
import { ArrowLeft, Users, Layers, Plus, X, UserCircle2 } from 'lucide-react'
import type { Member, MemberRole } from '../types'
import { INIT_MEMBERS } from '../data/mockMembers'

type SettingsTab = 'members' | 'funds'

interface Props {
  funds: string[]
  onFundsChange: (funds: string[]) => void
  onClose: () => void
}

export default function SettingsPage({ funds, onFundsChange, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('members')

  const TABS = [
    { key: 'members' as const, label: 'สมาชิก & สิทธิ์', Icon: Users },
    { key: 'funds'   as const, label: 'รายชื่อกองทุน',   Icon: Layers },
  ]

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Sarabun', system-ui, sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <button onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} /> กลับสู่กระดาน
        </button>
        <h1 className="font-bold text-gray-900">ตั้งค่าระบบ</h1>
        <div className="w-20" />
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6">
        <div className="flex gap-0">
          {TABS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
        {activeTab === 'members' && <MembersSection />}
        {activeTab === 'funds'   && <FundsSection funds={funds} onFundsChange={onFundsChange} />}
      </main>
    </div>
  )
}

// ─── Role badge styles ────────────────────────────────────────────────────────

const ROLE_STYLE: Record<MemberRole, string> = {
  Staff:   'bg-blue-50 text-blue-600 border-blue-200',
  Checker: 'bg-amber-50 text-amber-700 border-amber-200',
  Admin:   'bg-purple-50 text-purple-700 border-purple-200',
}

// ─── Members section ──────────────────────────────────────────────────────────

function MembersSection() {
  const [members, setMembers] = useState<Member[]>(INIT_MEMBERS)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<MemberRole>('Staff')

  const add = () => {
    const name = newName.trim()
    if (!name) return
    setMembers(p => [...p, { id: Date.now(), name, role: newRole }])
    setNewName('')
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      {/* List */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">รายชื่อสมาชิก</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Admin เห็นทุกออเดอร์ · Checker อนุมัติ/ตีกลับได้ · Staff รับงานปกติ
          </p>
        </div>
        <div className="divide-y divide-gray-50">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <UserCircle2 size={18} className="text-gray-400" />
              </div>
              <span className="flex-1 font-medium text-gray-800 text-sm">{m.name}</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${ROLE_STYLE[m.role]}`}>
                {m.role}
              </span>
              <select value={m.role}
                onChange={e => setMembers(p => p.map(x => x.id === m.id ? { ...x, role: e.target.value as MemberRole } : x))}
                className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-white focus:outline-none text-gray-600">
                <option>Staff</option><option>Checker</option><option>Admin</option>
              </select>
              <button onClick={() => setMembers(p => p.filter(x => x.id !== m.id))}
                className="text-gray-300 hover:text-rose-500 transition-colors shrink-0">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add form */}
      <div className="w-full sm:w-56 bg-white border border-gray-200 rounded-xl p-5 shrink-0">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">เพิ่มสมาชิก</h3>
        <label className="block text-xs text-gray-500 mb-1">ชื่อ</label>
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="เช่น พลอย"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-300" />
        <label className="block text-xs text-gray-500 mb-1">บทบาท</label>
        <select value={newRole} onChange={e => setNewRole(e.target.value as MemberRole)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white mb-4 focus:outline-none focus:ring-2 focus:ring-gray-300">
          <option>Staff</option><option>Checker</option><option>Admin</option>
        </select>
        <button onClick={add}
          className="w-full flex items-center justify-center gap-1.5 bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 transition-colors">
          <Plus size={14} /> เพิ่มสมาชิก
        </button>
      </div>
    </div>
  )
}

// ─── Funds section ────────────────────────────────────────────────────────────

function FundsSection({ funds, onFundsChange }: { funds: string[]; onFundsChange: (f: string[]) => void }) {
  const [newFund, setNewFund] = useState('')

  const add = () => {
    const name = newFund.trim().toUpperCase()
    if (!name || funds.includes(name)) return
    onFundsChange([...funds, name])
    setNewFund('')
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      {/* Grid of funds */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">รายชื่อกองทุน</h2>
          <p className="text-xs text-gray-400 mt-0.5">กองทุนเหล่านี้จะปรากฏใน dropdown ของฟอร์มตัวแทน</p>
        </div>
        <div className="p-5">
          {funds.length === 0 ? (
            <p className="text-center text-gray-300 py-8 text-sm">ยังไม่มีกองทุน</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {funds.map(f => (
                <div key={f}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 group">
                  <span className="text-sm font-semibold text-gray-700">{f}</span>
                  <button onClick={() => onFundsChange(funds.filter(x => x !== f))}
                    className="text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add form */}
      <div className="w-full sm:w-56 bg-white border border-gray-200 rounded-xl p-5 shrink-0">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">เพิ่มกองทุน</h3>
        <label className="block text-xs text-gray-500 mb-1">ชื่อกองทุน</label>
        <input value={newFund} onChange={e => setNewFund(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="เช่น K-NEW"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-gray-300" />
        <button onClick={add}
          className="w-full flex items-center justify-center gap-1.5 bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 transition-colors">
          <Plus size={14} /> เพิ่มกองทุน
        </button>
        <p className="text-xs text-gray-400 mt-3 text-center">จะถูกแปลงเป็นตัวพิมพ์ใหญ่</p>
      </div>
    </div>
  )
}
