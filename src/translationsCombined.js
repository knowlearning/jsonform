import teacherStems from './translationsTeacherStems.js'
import studentStems from './translationsStudentStems.js'
import itemInnerValues from './translationsItemInnerValues.js'

// Key is [itemName] for first-level labels
// Exception, for paragraph or headers (no item name), so use [questionnaireID]_[type]_[i]
// for the "choices" inside an item, the key is [itemName]_values_[value]

export default {
	...teacherStems,
	...studentStems,
	...itemInnerValues,
	 button_next: {
		fr: "Suivant",
		pl: "Dalej"
	  }
}