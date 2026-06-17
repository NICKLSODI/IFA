export type Status = 'รับเข้า' | 'รอตรวจ' | 'เสร็จสิ้น' | 'ตีกลับ'
export type Transaction = 'ซื้อ' | 'ขาย' | 'สับเปลี่ยน'
export type AmountUnit = 'บาท' | 'หน่วย' | 'ทั้งหมด'
export type MemberRole = 'Staff' | 'Checker' | 'Admin'

export interface TimelineEntry {
  time: string
  actor: string
  text: string
  teamsMsg?: string
}

export interface Case {
  id: number
  datetime: string
  customer: string
  transaction: Transaction
  fund: string
  fundOut?: string
  fundIn?: string
  amount: number | null
  amountUnit: AmountUnit
  agent: string
  accountNo: string
  appointmentTime: string
  appointmentLabel: string
  appointmentOverdue: boolean
  note: string
  status: Status
  hasCalled: boolean
  evidenceUrl: string | null
  timeline: TimelineEntry[]
}

export interface Member {
  id: number
  name: string
  role: MemberRole
}

export interface ToastItem {
  id: number
  message: string
  icon: string
}

export const FUNDS = ['K-CASH', 'KMASTER', 'K-FIXED', 'K-STAR', 'KFLEX', 'K-GLOBE', 'K-SELECT', 'K-PLAN']

export const STATUS_STYLE: Record<Status, string> = {
  'รับเข้า':   'bg-blue-100 text-blue-700 border border-blue-200',
  'รอตรวจ':  'bg-amber-100 text-amber-700 border border-amber-200',
  'เสร็จสิ้น': 'bg-green-100 text-green-600 border border-green-200',
  'ตีกลับ':  'bg-rose-100 text-rose-600 border border-rose-200',
}

export const isChecker = (role: string) => ['ป่าน', 'บุ๋ม', 'บอส'].includes(role)
