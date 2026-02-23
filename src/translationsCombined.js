import translations from './translations.js'

// Key is [itemName] for first-level labels
// Exception, for paragraph or headers (no item name), so use [questionnaireID]_[type]_[i]
// for the "choices" inside an item, the key is [itemName]_values_[value]

export default {
	...translations,
	button_next: {
		fr: "Suivant",
		pl: "Dalej"
	},
	alert_required: {
		fr: "Veuillez répondre à tous les éléments obligatoires",
		pl: "Proszę odpowiedzieć na wszystkie wymagane pytania"
	}
}