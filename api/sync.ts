import type { VercelRequest, VercelResponse } from '@vercel/node'

let cachedData: unknown = null

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'POST') {
    cachedData = req.body
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'GET') {
    return res.status(200).json(cachedData ?? { value: [] })
  }

  return res.status(405).end()
}
