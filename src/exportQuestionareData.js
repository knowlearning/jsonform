export default function exportQuestionareData() {
  const raw = (questionaireIdInput.value ?? '').trim()

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
  
}