import { useState } from 'react'
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter } from 'lucide-react'
import type { Case } from '../types'
import { STATUS_STYLE } from '../types'

type StatusFilter = 'ทุกสถานะ' | 'รับเข้า' | 'รอตรวจ' | 'ตีกลับ'
type SortMode = 'newest' | 'appointment'

const PAGE_SIZE = 10

interface Props {
  cases: Case[]
  onRowClick: (c: Case) => void
  isCompleted: boolean
}

export default function CaseTable({ cases, onRowClick, isCompleted }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ทุกสถานะ')
  const [search, setSearch]   = useState('')
  const [sort, setSort]       = useState<SortMode>('newest')
  const [page, setPage]       = useState(1)

  const filtered = cases.filter(c => {
    if (!isCompleted && statusFilter !== 'ทุกสถานะ' && c.status !== statusFilter) return false
    if (search && !c.customer.includes(search) && !c.fund.includes(search) && !c.agent.includes(search)) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) =>
    sort === 'newest'
      ? b.id - a.id
      : (a.appointmentTime || '').localeCompare(b.appointmentTime || '')
  )

  const total = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const rows  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const goTo  = (p: number) => setPage(Math.max(1, Math.min(total, p)))

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
        {!isCompleted && (
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400 shrink-0" />
            <select value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as StatusFilter); setPage(1) }}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-700">
              {(['ทุกสถานะ', 'รับเข้า', 'รอตรวจ', 'ตีกลับ'] as StatusFilter[]).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-gray-400 shrink-0" />
          <select value={sort}
            onChange={e => { setSort(e.target.value as SortMode); setPage(1) }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-700">
            <option value="newest">คำสั่งซื้อล่าสุด</option>
            <option value="appointment">เรียงตามเวลานัด</option>
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="ค้นหาลูกค้า / IFA / กองทุน"
              className="border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 w-52 sm:w-64 text-gray-700" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['วัน-เวลาเข้าระบบ', 'ลูกค้า', 'ธุรกรรม', 'กองทุน', 'จำนวน', 'IFA', 'เวลานัด', 'สถานะ'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap first:pl-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0
                ? <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-300">ไม่พบข้อมูล</td></tr>
                : rows.map(c => (
                  <tr key={c.id} onClick={() => onRowClick(c)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors">
                    <td className="pl-5 px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{c.datetime}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">{c.customer}</td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{c.transaction}</td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{c.fund}</td>
                    <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap tabular-nums">
                      {c.amount === null ? 'ทั้งหมด' : `${c.amount.toLocaleString()} ${c.amountUnit}`}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{c.agent}</td>
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                      {!c.appointmentTime
                        ? <span className="text-gray-300">—</span>
                        : c.evidenceUrl || c.status === 'ตีกลับ' || c.appointmentTime === 'ทันที'
                          ? <span className="text-gray-400">{c.appointmentTime}</span>
                          : <span className={`font-medium ${c.appointmentOverdue ? 'text-red-500' : 'text-green-600'}`}>
                              {c.appointmentTime}{c.appointmentLabel ? ` · ${c.appointmentLabel}` : ''}
                            </span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>แสดง {rows.length} จาก {sorted.length} รายการ</span>
          <div className="flex items-center gap-1">
            <PagBtn onClick={() => goTo(1)}         disabled={page === 1}>    <ChevronsLeft  size={13} /></PagBtn>
            <PagBtn onClick={() => goTo(page - 1)} disabled={page === 1}>    <ChevronLeft   size={13} /></PagBtn>
            <span className="px-2 text-gray-600 font-medium">{page} / {total}</span>
            <PagBtn onClick={() => goTo(page + 1)} disabled={page === total}><ChevronRight  size={13} /></PagBtn>
            <PagBtn onClick={() => goTo(total)}     disabled={page === total}><ChevronsRight size={13} /></PagBtn>
          </div>
        </div>
      </div>
    </div>
  )
}

function PagBtn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-500">
      {children}
    </button>
  )
}
