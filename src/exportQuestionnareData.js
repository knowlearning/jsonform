import translations from './translationsCombined.js'
import { extractQuestionnaireIds } from './extractQuestionnaireIds.js'

export default async function exportQuestionareData(data) {

  const questionnaireIds = await extractQuestionnaireIds(data)

  if (!questionnaireIds.length) {
    alert('No valid questionnaire IDs found.')
    return null
  }

  //  TODO: Gather data for each questionnaire and create csv for formats here: https://oecd.sharepoint.com/:x:/r/teams/2022-33BFDV/_layouts/15/Doc.aspx?sourcedoc=%7B8FB43087-02A2-452F-A21B-9D2067D4A80A%7D&file=Data%20output%20structure.xlsx&action=default&mobileredirect=true

  //  item id (name) | item type | whether or not reqd | sequence id | questionnaire id | sequence name | questionnaire name | num choices | item label | ...item label translations
  const rows = (await Promise.all(
    questionnaireIds.map(questionnaireItemRows)
  )).flat()

  return {
    filename: 'questionnaire-data.txt',
    rows
 }
}

async function processId(id) {
  const s = await Agent.state(id)
  if (s.formData) return questionnaireItemRows(id)
  else if ('application/json;type=sequence' === await Agent.metadata(id).then(s => s.active_type)) {
    return sequenceRows(id)
  }
}

async function sequenceRows(id) {
  const sequence = await Agent.state(id)
  const questionnaireIds = await Promise.all(sequence.items.map(item => item.id))
  return Promise.all(
    questionnaireIds.map(questionnaireItemRows)
  )
}

async function questionnaireItemRows(questionnaire_id) {
  const q = await Agent.state(questionnaire_id)

  if (!q.formData) throw new Error('not a questionnaire')

  return q.formData.map(({ name, type, label, required }, index) => {
    const id = name || `${questionnaire_id}_${type}_${index}`
    const labelTranslations = {}

    Object
      .entries(translations[id] || {})
      .forEach(([lang, value]) => labelTranslations[`question_${lang}`] = value)

    return {
      id,
      questionnaire_id,
      questionnaire_order: index,
      type,
      question: label,
      required,
      ...labelTranslations
    } //  TODO: add sequence id
  }).filter(v => v != null)
}