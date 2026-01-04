import { validate as isUUID } from 'uuid'
import translations from './translationsCombined.js'

export default async function exportQuestionareData(data) {
  const raw = (data ?? '').trim()

  if (!raw) {
    alert('No questionnaire ids provided.')
    return []
  }

  const candidates = raw
    .split(/\r?\n/)
    .flatMap(line => line.split(/[,\s]+/))
    .map(s => s.trim())
    .filter(Boolean)

  const invalid = []
  const valid = []

  for (const id of candidates) {
    if (isUUID(id)) valid.push(id)
    else invalid.push(id)
  }

  const seen = new Set()
  const validatedUuids = valid.filter(id => {
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })

  if (invalid.length) {
    alert('Invalid UUID(s) provided:', invalid)
    return []
  }

  if (!validatedUuids.length) {
    alert('No valid UUIDs found.')
    return []
  }


  //  TODO: Gather data for each questionaire and create csv for formats here: https://oecd.sharepoint.com/:x:/r/teams/2022-33BFDV/_layouts/15/Doc.aspx?sourcedoc=%7B8FB43087-02A2-452F-A21B-9D2067D4A80A%7D&file=Data%20output%20structure.xlsx&action=default&mobileredirect=true

  //  item id (name) | item type | whether or not reqd | sequence id | questionaire id | sequence name | questionaire name | num choices | item label | ...item label translations
  const rows = await Promise.all(
    validatedUuids.map(questionaireItemRows)
  )

  download(JSON.stringify(rows, null, 4), 'stuff.txt')
}

async function questionaireItemRows(questionaire_id) {
  const q = await Agent.state(questionaire_id)

  if (!q.formData) throw new Error('not a questionaire')

  return q.formData.map(({ name, type, label, required }, index) => {
    const id = name || `${questionaire_id}_${type}_${index}`
    const labelTranslations = {}

    Object
      .entries(translations[id] || {})
      .forEach((lang, value) => labelTranslations[`question_${lang}`] = value)

    return {
      id,
      questionaire_id,
      questionaire_order: index,
      type,
      question: label,
      required,
      ...labelTranslations
    } //  TODO: add sequence id
  }).filter(v => v != null)
}

function download(data, filename) {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()

  URL.revokeObjectURL(url)
}