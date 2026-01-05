import { validate as isUUID } from 'uuid'

/**
 * Takes raw form input and returns flattened questionnaire IDs.
 */
export async function extractQuestionnaireIds(rawInput) {
  const raw = (rawInput ?? '').trim()

  if (!raw) {
    console.log('No questionnaire ids provided.')
    return []
  }

  // Parse & normalize
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

  if (invalid.length) {
    console.log('Invalid UUID(s) provided:', invalid)
    return []
  }

  // De-duplicate
  const seen = new Set()
  const uniqueIds = valid.filter(id => {
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })

  const questionnaireIds = new Set()

  for (const id of uniqueIds) {
    const state = await Agent.state(id)

    // Case 1: top-level questionnaire
    if (state?.formData) {
      questionnaireIds.add(id)
      continue
    }

    // Case 2: sequence
    const meta = await Agent.metadata(id)
    if (meta?.active_type === 'application/json;type=sequence') {
      const sequence = state

      for (const item of sequence.items ?? []) {
        try {
          const itemState = await Agent.state(item.id)
          if (itemState?.formData) {
            questionnaireIds.add(item.id)
          }
          // silently ignore non-questionnaire sub-items
        } catch {
          // silently ignore bad sub-items
        }
      }

      continue
    }

    // Case 3: neither questionnaire nor sequence
    console.log(`Unrecognized ID (not questionnaire or sequence): ${id}`)
  }

  return Array.from(questionnaireIds)
}
