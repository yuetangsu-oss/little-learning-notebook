import { openDB } from 'idb'
import type { Category, DraftRecord, LearningRecord } from './types'

const database = openDB('little-learning-notebook', 1, {
  upgrade(db) {
    const store = db.createObjectStore('records', { keyPath: 'id' })
    store.createIndex('category', 'category')
    store.createIndex('createdAt', 'createdAt')
  },
})

export async function getAllRecords(): Promise<LearningRecord[]> {
  const records = (await (await database).getAll('records')) as LearningRecord[]
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function saveRecord(
  draft: DraftRecord,
  existing?: LearningRecord,
): Promise<LearningRecord> {
  const now = new Date().toISOString()
  const record = {
    ...draft,
    id: existing?.id ?? crypto.randomUUID(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  } as LearningRecord
  await (await database).put('records', record)
  return record
}

export async function deleteRecord(id: string): Promise<void> {
  await (await database).delete('records', id)
}

export interface BackupFile {
  app: 'little-learning-notebook'
  version: 1
  exportedAt: string
  records: LearningRecord[]
}

export function createBackup(records: LearningRecord[]): BackupFile {
  return {
    app: 'little-learning-notebook',
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
  }
}

export function parseBackup(value: unknown): BackupFile {
  if (!value || typeof value !== 'object') throw new Error('备份文件格式不正确')
  const candidate = value as Partial<BackupFile>
  if (candidate.app !== 'little-learning-notebook' || candidate.version !== 1 || !Array.isArray(candidate.records)) {
    throw new Error('这不是学习小本的有效备份文件')
  }
  if (!candidate.records.every(isValidRecord)) throw new Error('备份文件中包含无法识别的记录')
  return candidate as BackupFile
}

export async function mergeBackup(
  current: LearningRecord[],
  imported: LearningRecord[],
): Promise<{ records: LearningRecord[]; added: number; skipped: number }> {
  const merged = [...current]
  const db = await database
  let added = 0
  let skipped = 0

  for (const record of imported) {
    if (isDuplicate(merged, record.category, primaryValue(record))) {
      skipped += 1
      continue
    }
    const safeRecord = { ...record, id: crypto.randomUUID() }
    await db.put('records', safeRecord)
    merged.push(safeRecord)
    added += 1
  }

  return {
    records: merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    added,
    skipped,
  }
}

function isValidRecord(value: unknown): value is LearningRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<LearningRecord>
  if (typeof record.id !== 'string' || typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string') return false
  if (record.category === 'chinese') return typeof record.text === 'string' && typeof record.pinyin === 'string' && typeof record.note === 'string'
  if (record.category === 'english') return typeof record.term === 'string' && typeof record.meaning === 'string' && typeof record.example === 'string'
  if (record.category === 'math') return typeof record.numeral === 'string' && /^\d+$/.test(record.numeral)
  return false
}

export function primaryValue(record: LearningRecord): string {
  if (record.category === 'chinese') return record.text
  if (record.category === 'english') return record.term
  return record.numeral
}

export function isDuplicate(
  records: LearningRecord[],
  category: Category,
  value: string,
  editingId?: string,
): boolean {
  const normalized = value.trim().toLocaleLowerCase()
  return records.some(
    (record) =>
      record.category === category &&
      record.id !== editingId &&
      primaryValue(record).trim().toLocaleLowerCase() === normalized,
  )
}
