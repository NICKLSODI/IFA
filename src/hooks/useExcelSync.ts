import { useState, useEffect, useCallback, useRef } from 'react'
import type { Case } from '../types'
import { EXCEL_URL, POWER_AUTOMATE_URL, POLL_INTERVAL_MS } from '../config/sharepoint'
import { parseExcelBuffer, parseJsonRows } from '../services/excelParser'

export type SyncStatus = 'idle' | 'loading' | 'ok' | 'error' | 'unconfigured'

interface SyncState {
  status: SyncStatus
  lastSync: Date | null
  error: string | null
}

const OVERRIDES_KEY = 'ifa-case-overrides'

// Local overrides: { [id]: Partial<Case> } — preserves status/evidence set by Sales Support
function loadOverrides(): Record<number, Partial<Case>> {
  try {
    return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || '{}')
  } catch { return {} }
}

function saveOverride(id: number, patch: Partial<Case>) {
  const overrides = loadOverrides()
  overrides[id] = { ...(overrides[id] || {}), ...patch }
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides))
}

// Merge fresh Excel cases with locally-stored status overrides
function mergeWithOverrides(excelCases: Case[]): Case[] {
  const overrides = loadOverrides()
  return excelCases.map(c => {
    const o = overrides[c.id]
    return o ? { ...c, ...o } : c
  })
}

interface UseExcelSyncResult {
  sync:       SyncState
  /** Persist a status/evidence update so it survives Excel re-pulls */
  saveLocal:  (id: number, patch: Partial<Case>) => void
  /** Manually trigger a re-fetch */
  refetch:    () => void
}

export function useExcelSync(
  setCases: React.Dispatch<React.SetStateAction<Case[]>>
): UseExcelSyncResult {
  const isConfigured = !!(POWER_AUTOMATE_URL || EXCEL_URL)
  const [sync, setSync] = useState<SyncState>({
    status:   isConfigured ? 'idle' : 'unconfigured',
    lastSync: null,
    error:    null,
  })
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchAndMerge = useCallback(async () => {
    if (!POWER_AUTOMATE_URL && !EXCEL_URL) {
      setSync({ status: 'unconfigured', lastSync: null, error: null })
      return
    }
    setSync(s => ({ ...s, status: 'loading' }))
    try {
      let fresh: Case[]
      if (POWER_AUTOMATE_URL) {
        const res = await fetch(POWER_AUTOMATE_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        fresh = parseJsonRows(json)
      } else {
        const res = await fetch(EXCEL_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const buf = await res.arrayBuffer()
        fresh = parseExcelBuffer(buf)
      }
      setCases(mergeWithOverrides(fresh))
      setSync({ status: 'ok', lastSync: new Date(), error: null })
    } catch (e) {
      setSync(s => ({ ...s, status: 'error', error: String(e) }))
    }
  }, [setCases])

  useEffect(() => {
    fetchAndMerge()
    if (POLL_INTERVAL_MS > 0) {
      pollRef.current = setInterval(fetchAndMerge, POLL_INTERVAL_MS)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchAndMerge])

  const saveLocal = useCallback((id: number, patch: Partial<Case>) => {
    saveOverride(id, patch)
  }, [])

  return { sync, saveLocal, refetch: fetchAndMerge }
}
