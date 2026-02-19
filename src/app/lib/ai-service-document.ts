import { aiService } from './ai-service'
import type { CvDocument, CvJob, CvJobAchievement, CvSubAchievement, CvMetric, CvEducation, CvLanguageSkill } from './ai-config'

interface GenerateCvDocumentInput {
  templateId: string
  templateSchema: any
  rawText: string
  locale: string
  idempotencyKey?: string
  revision?: number
}

interface GenerateCvDocumentResult {
  document: CvDocument
  sanitizedTemplateSchema: any
  originalTemplateStrings: string[]
}

function createIdempotencyKey(source?: string): string {
  if (source && source.trim().length > 0) return source
  return `cv_${Math.random().toString(36).slice(2)}`
}

function collectTemplateStrings(value: any, acc: Set<string>) {
  if (value == null) return
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length > 0) acc.add(trimmed)
    return
  }
  if (Array.isArray(value)) {
    value.forEach(v => collectTemplateStrings(v, acc))
    return
  }
  if (typeof value === 'object') {
    Object.values(value).forEach(v => collectTemplateStrings(v, acc))
  }
}

function zeroOutTemplateStrings(value: any): any {
  if (value == null) return value
  if (typeof value === 'string') return ''
  if (Array.isArray(value)) return value.map(v => zeroOutTemplateStrings(v))
  if (typeof value === 'object') {
    const result: any = {}
    Object.entries(value).forEach(([k, v]) => {
      result[k] = zeroOutTemplateStrings(v)
    })
    return result
  }
  return value
}

function normalizeArray(input: any): string[] {
  if (!input) return []
  if (Array.isArray(input)) {
    return input
      .map(v => (typeof v === 'string' ? v : ''))
      .filter(v => v && v.trim().length > 0)
  }
  if (typeof input === 'string') {
    return input
      .split(/[,\n]/)
      .map(v => v.trim())
      .filter(Boolean)
  }
  return []
}

function buildJobs(entities: any): CvJob[] {
  const source = Array.isArray(entities?.experience) ? entities.experience : []
  return source.map((exp: any, index: number) => {
    const baseMetrics: CvMetric[] = []
    const achievementsRaw = normalizeArray(exp.achievements || exp.description)
    const subAchievements: CvSubAchievement[] = achievementsRaw.map(text => ({
      text,
      metrics: baseMetrics,
      keywords: []
    }))
    const achievement: CvJobAchievement = {
      title: 'Achievements',
      items: subAchievements
    }
    const job: CvJob = {
      id: `job-${index}`,
      title: exp.position || entities?.professional?.job_title || '',
      company: exp.company_name || exp.company || '',
      location: exp.location || entities?.personal?.location || '',
      startDate: exp.start_date || exp.start || '',
      endDate: exp.end_date || exp.end || '',
      achievements: [achievement]
    }
    return job
  })
}

function buildEducation(entities: any): CvEducation[] {
  const source = Array.isArray(entities?.education) ? entities.education : []
  return source.map((ed: any, index: number) => {
    const degree = ed.degree || ed.title || ''
    const institution = ed.institution || ed.school || ''
    const startDate = ed.start_date || ed.start || ''
    const endDate = ed.end_date || ed.end || ed.graduation_year || ''
    const details = ed.details || ed.gpa || ''
    const item: CvEducation = {
      id: `edu-${index}`,
      degree,
      institution,
      startDate,
      endDate,
      details
    }
    return item
  })
}

function buildSkills(entities: any) {
  const skills = entities?.skills || {}
  const categories: { name: string; items: string[] }[] = []
  const technical = normalizeArray(skills.technical || skills.technical_skills)
  if (technical.length) {
    categories.push({ name: 'Technical Skills', items: technical })
  }
  const soft = normalizeArray(skills.soft || skills.soft_skills)
  if (soft.length) {
    categories.push({ name: 'Soft Skills', items: soft })
  }
  const tools = normalizeArray(skills.tools)
  if (tools.length) {
    categories.push({ name: 'Tools', items: tools })
  }
  const languages = normalizeArray(skills.languages)
  if (languages.length && !categories.find(c => c.name === 'Languages')) {
    categories.push({ name: 'Languages', items: languages })
  }
  return { categories }
}

function buildLanguages(entities: any): CvLanguageSkill[] {
  const skills = entities?.skills || {}
  const languages = normalizeArray(skills.languages)
  return languages.map(name => ({
    name,
    proficiency: 'proficient'
  }))
}

function buildCvDocumentFromEntities(
  templateId: string,
  locale: string,
  rawText: string,
  entities: any,
  idempotencyKey: string,
  revision: number
): CvDocument {
  const personal = entities?.personal || {}
  const professional = entities?.professional || {}
  const summaryEntity = entities?.summary || {}
  const jobs = buildJobs(entities)
  const education = buildEducation(entities)
  const skills = buildSkills(entities)
  const languages = buildLanguages(entities)
  const document: CvDocument = {
    meta: {
      templateId,
      locale,
      idempotencyKey,
      revision,
      model: 'cv-document-generator',
      generatedAt: new Date().toISOString()
    },
    personal: {
      fullName: personal.full_name || '[Your Name]',
      email: personal.email,
      phone: personal.phone,
      location: personal.location,
      socials: {
        linkedin: personal.linkedin,
        github: personal.github,
        website: personal.website,
        twitter: personal.twitter,
        portfolio: personal.portfolio
      }
    },
    summary:
      summaryEntity.professional_summary ||
      professional.objective ||
      professional.about_me ||
      '',
    jobs,
    education,
    skills,
    projects: [],
    certifications: [],
    awards: [],
    languages,
    hobbies: [],
    references: [],
    rawText
  }
  return document
}

function collectDocumentStrings(value: any, acc: Set<string>) {
  if (value == null) return
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length > 0) acc.add(trimmed)
    return
  }
  if (Array.isArray(value)) {
    value.forEach(v => collectDocumentStrings(v, acc))
    return
  }
  if (typeof value === 'object') {
    Object.values(value).forEach(v => collectDocumentStrings(v, acc))
  }
}

export function analyzeTemplateContamination(document: CvDocument, originalTemplateStrings: string[]) {
  const docStrings = new Set<string>()
  collectDocumentStrings(document, docStrings)
  const surviving: string[] = []
  originalTemplateStrings.forEach(s => {
    const trimmed = s.trim()
    if (!trimmed) return
    for (const v of docStrings) {
      if (v.includes(trimmed) || trimmed.includes(v)) {
        surviving.push(trimmed)
        break
      }
    }
  })
  return {
    surviving,
    totalTemplateStrings: originalTemplateStrings.length
  }
}

export async function generateCvDocumentFromTemplate(
  input: GenerateCvDocumentInput
): Promise<GenerateCvDocumentResult> {
  const idempotencyKey = createIdempotencyKey(input.idempotencyKey)
  const revision = input.revision ?? 1
  const originalStrings = new Set<string>()
  collectTemplateStrings(input.templateSchema, originalStrings)
  const sanitizedTemplateSchema = zeroOutTemplateStrings(input.templateSchema)
  const entities = await aiService.extractEntities(input.rawText, 'cv')
  const document = buildCvDocumentFromEntities(
    input.templateId,
    input.locale,
    input.rawText,
    entities,
    idempotencyKey,
    revision
  )
  return {
    document,
    sanitizedTemplateSchema,
    originalTemplateStrings: Array.from(originalStrings)
  }
}
