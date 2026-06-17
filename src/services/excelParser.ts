import * as XLSX from 'xlsx'
import type { Case, Transaction, AmountUnit } from '../types'
import { COLUMN_MAP, EXCEL_SHEET } from '../config/sharepoint'

type RawRow = Record<string, string | number | Date | undefined>

// ── Shared helpers ────────────────────────────────────────────────────────────

function toThai(date: Date): string {
  return date.toLocaleString('th-TH', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function parseDate(raw: string | number | Date | undefined): string {
  if (!raw) return toThai(new Date())
  if (raw instanceof Date) return toThai(raw)
  const d = new Date(String(raw))
  return isNaN(d.getTime()) ? String(raw) : toThai(d)
}

function parseAppointmentTime(raw: string | undefined): { time: string; overdue: boolean } {
  if (!raw) return { time: '', overdue: false }
  const s = String(raw).trim()
  if (s === 'ทันที') return { time: 'ทันที', overdue: false }
  return { time: s, overdue: false }
}

// ── Core row → Case mapper (shared by both parsers) ───────────────────────────

function rowToCase(row: RawRow, index: number): Case {
  const C       = COLUMN_MAP
  const rawId   = row[C.id]
  const id      = typeof rawId === 'number' ? rawId : index + 1
  const txRaw   = String(row[C.transaction] || 'ซื้อ') as Transaction
  const fundOut = String(row[C.fundOut] || '').trim() || undefined
  const fundIn  = String(row[C.fundIn]  || '').trim() || undefined
  const unit    = String(row[C.amountUnit] || 'บาท') as AmountUnit
  const amt     = unit === 'ทั้งหมด' ? null : Number(row[C.amount]) || 0
  const fund    = txRaw === 'สับเปลี่ยน' && fundOut && fundIn
    ? `${fundOut} → ${fundIn}`
    : String(row[C.fund] || '').trim()

  const datetime = parseDate(row[C.submittedAt] as string | Date | undefined)
  const { time: appointmentTime, overdue: appointmentOverdue } =
    parseAppointmentTime(String(row[C.appointmentTime] || ''))

  return {
    id,
    datetime,
    customer:         String(row[C.customer]  || '').trim(),
    agent:            String(row[C.ifaName]   || '').trim(),
    accountNo:        String(row[C.accountNo] || '').trim(),
    transaction:      txRaw,
    fund,
    fundOut,
    fundIn,
    amount:           amt,
    amountUnit:       unit,
    appointmentTime,
    appointmentLabel: '',
    appointmentOverdue,
    note:             String(row[C.note] || '').trim(),
    status:           'รับเข้า',
    hasCalled:        false,
    evidenceUrl:      null,
    timeline: [{
      time:     datetime,
      actor:    'ระบบ',
      text:     `รับออเดอร์จาก IFA ${String(row[C.ifaName] || '')} — Microsoft Forms`,
      teamsMsg: `ออเดอร์ใหม่ ${String(row[C.customer] || '')}`,
    }],
  } satisfies Case
}

// ── Power Automate → JSON ─────────────────────────────────────────────────────
// Parses the response from "List rows present in a table" action.

export function parseJsonRows(json: { value?: RawRow[] }): Case[] {
  return (json?.value ?? []).map((row, i) => rowToCase(row, i))
}

// ── Direct Excel binary (fallback when EXCEL_URL is set) ─────────────────────

export function parseExcelBuffer(buffer: ArrayBuffer): Case[] {
  const wb       = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = wb.SheetNames.find(n => n === EXCEL_SHEET) ?? wb.SheetNames[0]
  const ws       = wb.Sheets[sheetName]
  if (!ws) return []
  const rows = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: '' })
  return rows.map((row, i) => rowToCase(row, i))
}
