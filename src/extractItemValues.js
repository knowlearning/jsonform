import { extractQuestionnaireIds } from './extractQuestionnaireIds.js'
import translations from './translationsCombined.js'

/* Export questionnaire value rows
 Columns:
 1. questionnaire_id
 2. item_id (name)
 3. value
 4. label
*/

export default async function exportQuestionnaireValues(data) {
  const questionnaireIds = await extractQuestionnaireIds(data)

  if (!questionnaireIds.length) {
    alert('No valid questionnaire IDs found.')
    return []
  }

  const rows = (
    await Promise.all(
      questionnaireIds.map(questionnaireValueRows)
    )
  ).flat()

  download(JSON.stringify(rows, null, 4), 'questionnaire-values.txt')
}

async function questionnaireValueRows(questionnaire_id) {
  const q = await Agent.state(questionnaire_id)

  if (!q?.formData) return []

  return q.formData.flatMap(item => {
    const { name, values } = item

    // Only process items with BOTH a name and a values array
    if (!name || !Array.isArray(values)) return []

    return values.map(v => {
      const translationKey = `${name}_values_${v.value}`
      const translatedLabels = {}
      Object.entries(translations[translationKey] || []).forEach(([lang, value]) => {
        translatedLabels[`label_${lang}`] = value
      })
      return {
        questionnaire_id,
        id: name,
        value: v.value,
        label: v.label,
        ...translatedLabels
      }
    })
  })
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
