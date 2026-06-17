import { useState } from 'react'
import {
  ArrowLeft, Clock, Camera, Lock, CheckCircle2, XCircle,
  ImagePlus, Bell, AlertCircle, Send, Check,
} from 'lucide-react'
import type { Case, TimelineEntry } from '../types'
import { STATUS_STYLE, isChecker } from '../types'

interface Props {
  c: Case
  role: string
  onBack: () => void
  onUpdate: (updates: Partial<Case>) => void
  showToast: (msg: string, icon?: string) => void
}

const STEPS = [
  { num: 1, label: 'แนบหลักฐาน' },
  { num: 2, label: 'รอตรวจ' },
  { num: 3, label: 'เสร็จสิ้น' },
]

function currentStep(c: Case) {
  if (c.status === 'รับเข้า') return c.evidenceUrl ? 2 : 1
  if (c.status === 'ตีกลับ') return 1
  if (c.status === 'รอตรวจ') return 2
  return 3
}

function nowThai() {
  return new Date().toLocaleString('th-TH', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function addLog(c: Case, actor: string, text: string, teamsMsg?: string): TimelineEntry[] {
  return [...c.timeline, { time: nowThai(), actor, text, teamsMsg }]
}

export default function CaseDetail({ c, role, onBack, onUpdate, showToast }: Props) {
  const [checkerComment, setCheckerComment] = useState('')
  const step          = currentStep(c)
  const checker       = isChecker(role)
  const evidenceDone  = !!c.evidenceUrl
  const hideCountdown = evidenceDone || c.status === 'ตีกลับ'

  const doAttachEvidence = () => {
    const url      = 'https://placehold.co/800x400/e2e8f0/64748b?text=FUNDCONNEXT+Screenshot'
    const timeline = addLog(c, role, 'แนบภาพหลักฐานระบบ Fundconnext แล้ว')
    onUpdate({ evidenceUrl: url, timeline })
    showToast('แนบหลักฐานเรียบร้อย — กดส่ง Checker ได้เลย', '📸')
  }

  const doSubmitToChecker = () => {
    const timeline = addLog(c, role, 'ยื่นส่งให้ Checker ตรวจรับรอง', `ออเดอร์ ${c.customer} รอตรวจ`)
    onUpdate({ status: 'รอตรวจ', timeline })
    showToast(`ส่ง Checker แล้ว — ${c.customer}`, '🔍')
  }

  const doApprove = () => {
    const timeline = addLog(c, role, 'Checker อนุมัติ — ออเดอร์เสร็จสิ้น', `✅ ${c.customer} เสร็จสิ้น`)
    onUpdate({ status: 'เสร็จสิ้น', timeline })
    showToast(`อนุมัติแล้ว — ${c.customer} เสร็จสิ้น`, '✅')
    onBack()
  }

  const doReject = () => {
    const comment  = checkerComment.trim() || 'ไม่ระบุเหตุผล'
    const timeline = addLog(c, role, `Checker ตีกลับ: ${comment}`, `❌ ${c.customer} ถูกตีกลับ`)
    onUpdate({ status: 'ตีกลับ', timeline })
    showToast(`ตีกลับแล้ว — ${c.customer}`, '❌')
  }

  const displayFund = c.transaction === 'สับเปลี่ยน' && c.fundOut && c.fundIn
    ? `${c.fundOut} → ${c.fundIn}` : c.fund

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Sarabun', system-ui, sans-serif" }}>
      {/* ── Top bar ── */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} /> กลับสู่กระดาน
        </button>
        <div className="text-center">
          <p className="font-semibold text-gray-900 text-sm">รายละเอียดคำสั่ง</p>
          <p className="text-xs text-gray-400">{c.datetime}</p>
        </div>
        <p className="text-xs text-gray-500">
          บทบาท: <span className="font-semibold text-gray-800">{role}</span>
        </p>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 space-y-4">

        {/* ── Info card ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-gray-900">รายละเอียดคำสั่ง</h2>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[c.status]}`}>
                {c.status}
              </span>
            </div>
            {/* Appointment badge */}
            {c.appointmentTime && c.appointmentTime !== 'ทันที' && !hideCountdown && (
              <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border ${
                c.appointmentOverdue
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-green-50 text-green-700 border-green-200'
              }`}>
                <Bell size={12} />
                นัด {c.appointmentTime}{c.appointmentLabel ? ` · ${c.appointmentLabel}` : ''}
              </div>
            )}
            {c.appointmentTime && (hideCountdown || c.appointmentTime === 'ทันที') && (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-gray-50 text-gray-400 border-gray-200">
                <Clock size={12} />
                {c.appointmentTime === 'ทันที' ? 'ทันที' : `นัด ${c.appointmentTime}`}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-sm">
            <Info label="IFA"  value={c.agent} />
            <Info label="วันที่รับเรื่อง"  value={c.datetime.split(' ')[0]} />
            <Info label="เวลานัด"         value={c.appointmentTime || '—'} />
            <Info label="ธุรกรรม"         value={c.transaction} />
            <Info label="ลูกค้า"          value={c.customer} />
            <Info label="เลขที่บัญชี"     value={c.accountNo} />
            <Info label={c.transaction === 'สับเปลี่ยน' ? 'กองทุน (ออก → เข้า)' : 'กองทุน'} value={displayFund} />
            <Info label="จำนวน"           value={c.amount === null ? 'ทั้งหมด' : `${c.amount.toLocaleString()} ${c.amountUnit}`} />
            {c.note && (
              <div className="col-span-2 sm:col-span-4">
                <p className="text-xs text-gray-400 mb-0.5">หมายเหตุ</p>
                <p className="font-semibold text-red-600 text-sm">{c.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Two-column: action + timeline ── */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">

          {/* ── Left: action panel ── */}
          <div className="w-full lg:flex-1 bg-white border border-gray-200 rounded-xl p-5 space-y-5">
            {/* Step progress */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">ขั้นตอน</p>
              <div className="flex items-center gap-0">
                {STEPS.map((s, i) => {
                  const done   = s.num < step
                  const active = s.num === step
                  return (
                    <div key={s.num} className="flex items-center flex-1 min-w-0">
                      <div className={`flex-1 rounded-lg border px-3 py-2 text-center ${
                        active ? 'bg-blue-50 border-blue-200'
                        : done  ? 'bg-gray-50 border-gray-100'
                        :         'bg-white border-gray-100'
                      }`}>
                        <div className="flex items-center justify-center mb-0.5">
                          {done
                            ? <Check size={12} className="text-green-500" />
                            : <span className={`text-xs font-bold ${active ? 'text-blue-600' : 'text-gray-300'}`}>{s.num}</span>}
                        </div>
                        <p className={`text-xs font-medium ${active ? 'text-blue-700' : done ? 'text-gray-500' : 'text-gray-300'}`}>
                          {s.label}
                        </p>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`w-3 h-px shrink-0 ${done ? 'bg-gray-300' : 'bg-gray-100'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Status banner */}
            {c.status === 'รับเข้า' && !evidenceDone && (
              <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-700 text-sm font-medium">
                <AlertCircle size={16} className="shrink-0" />
                แนบภาพหลักฐาน Fundconnext เพื่อดำเนินการต่อ
              </div>
            )}
            {c.status === 'รับเข้า' && evidenceDone && (
              <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm font-medium">
                <CheckCircle2 size={16} className="shrink-0" />
                แนบหลักฐานแล้ว — กดส่ง Checker ได้เลย
              </div>
            )}
            {c.status === 'รอตรวจ' && (
              <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-blue-700 text-sm font-medium">
                <Clock size={16} className="shrink-0" />
                รอ Checker ตรวจรับรอง
              </div>
            )}
            {c.status === 'ตีกลับ' && (
              <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 text-rose-700 text-sm font-medium">
                <XCircle size={16} className="shrink-0" />
                ถูกตีกลับ — กรุณาแก้ไขและส่งใหม่
              </div>
            )}

            {/* Evidence */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                ภาพหลักฐานระบบ FUNDCONNEXT
              </p>
              {evidenceDone ? (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <img src={c.evidenceUrl!} alt="evidence" className="w-full object-cover" />
                </div>
              ) : c.status === 'รับเข้า' || c.status === 'ตีกลับ' ? (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg py-12 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group">
                  <div className="w-12 h-12 bg-gray-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mb-3 transition-colors">
                    <ImagePlus size={22} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">คลิกเพื่อแนบภาพหลักฐาน</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG — ไม่เกิน 10MB</p>
                  <input type="file" accept="image/*" className="hidden" onChange={doAttachEvidence} />
                </label>
              ) : (
                <div className="flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-lg py-12 bg-gray-50">
                  <Lock size={20} className="text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">ไม่สามารถแนบหลักฐานในสถานะนี้</p>
                </div>
              )}
            </div>

            {/* Submit to checker */}
            <button onClick={doSubmitToChecker}
              disabled={!evidenceDone || c.status !== 'รับเข้า'}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-colors ${
                evidenceDone && c.status === 'รับเข้า'
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}>
              <Send size={15} /> ยื่นส่งให้ Checker ตรวจรับรอง
            </button>

            {/* Checker panel */}
            {c.status === 'รอตรวจ' && checker && (
              <div className="border-t border-gray-100 pt-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  แผง Checker
                </p>
                <textarea value={checkerComment} onChange={e => setCheckerComment(e.target.value)}
                  placeholder="หมายเหตุ (ถ้ามี)..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
                <div className="flex gap-3">
                  <button onClick={doApprove}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg py-3 text-sm font-semibold hover:bg-green-700 transition-colors">
                    <CheckCircle2 size={16} /> อนุมัติ
                  </button>
                  <button onClick={doReject}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg py-3 text-sm font-semibold hover:bg-rose-100 transition-colors">
                    <XCircle size={16} /> ตีกลับ
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Timeline ── */}
          <div className="w-full lg:w-72 shrink-0 bg-white border border-gray-200 rounded-xl p-5 lg:sticky lg:top-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">ไทม์ไลน์</p>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {c.timeline.map((t, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-0.5 shrink-0">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <Clock size={11} className="text-gray-400" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 leading-tight">{t.time}</p>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">{t.actor}</p>
                    <p className="text-sm text-gray-800 mt-0.5 leading-snug">{t.text}</p>
                    {t.teamsMsg && (
                      <div className="mt-1 flex items-start gap-1.5">
                        <Bell size={10} className="text-purple-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-400 break-words">{t.teamsMsg}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="font-semibold text-gray-800 text-sm">{value}</p>
    </div>
  )
}
