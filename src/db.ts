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
