export type Category = 'chinese' | 'english' | 'math'

export interface BaseRecord {
  id: string
  createdAt: string
  updatedAt: string
}

export interface ChineseRecord extends BaseRecord {
  category: 'chinese'
  text: string
  pinyin: string
  note: string
}

export interface EnglishRecord extends BaseRecord {
  category: 'english'
  term: string
  meaning: string
  example: string
}

export interface MathRecord extends BaseRecord {
  category: 'math'
  numeral: string
}

export type LearningRecord = ChineseRecord | EnglishRecord | MathRecord
export type DraftRecord =
  | Pick<ChineseRecord, 'category' | 'text' | 'pinyin' | 'note'>
  | Pick<EnglishRecord, 'category' | 'term' | 'meaning' | 'example'>
  | Pick<MathRecord, 'category' | 'numeral'>
