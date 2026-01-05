import { validate as isUUID } from 'uuid'
import translations from './translationsCombined.js'
import { extractQuestionnaireIds } from './extractQuestionnaireIds.js'

export default async function exportQuestionareData(data) {

  const questionnaireIds = await extractQuestionnaireIds(data)

  if (!questionnaireIds.length) {
    alert('No valid questionnaire IDs found.')
    return []
  }

  //  TODO: Gather data for each questionaire and create csv for formats here: https://oecd.sharepoint.com/:x:/r/teams/2022-33BFDV/_layouts/15/Doc.aspx?sourcedoc=%7B8FB43087-02A2-452F-A21B-9D2067D4A80A%7D&file=Data%20output%20structure.xlsx&action=default&mobileredirect=true

  //  item id (name) | item type | whether or not reqd | sequence id | questionaire id | sequence name | questionaire name | num choices | item label | ...item label translations
  const rows = await Promise.all(
    questionnaireIds.map(questionaireItemRows)
  )

  download(JSON.stringify(rows, null, 4), 'stuff.txt')
}

async function processId(id) {
  const s = await Agent.state(id)
  if (s.formData) return questionaireItemRows(id)
  else if ('application/json;type=sequence' === await Agent.metadata(id).then(s => s.active_type)) {
    return sequenceRows(id)
  }
}

async function sequenceRows(id) {
  const sequence = await Agent.state(id)
  const questionaireIds = await Promise.all(sequence.items.map(item => item.id))
  return Promise.all(
    questionaireIds.map(questionaireItemRows)
  )
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