<script setup>
  import { ref, watch, onMounted, reactive } from 'vue'
  import * as jsonpatch from 'fast-json-patch'
  import isEqual from 'lodash/isEqual'
  import debounce from 'lodash/debounce'
  import TRANSLATION_MAP from './translationsCombined.js'

  const copy = x => JSON.parse(JSON.stringify(x))

  const props = defineProps({ id: String })

  const env = await Agent.environment()
  const forcedLanguage = env.variables.FORCED_LANGUAGE

  let rendererInstance
  const renderer = ref(null)
  const runstate = await Agent.state(`runstate/${props.id}`)

  runstate.xapi = {
    actor: props.id,
    verb: 'initialized',
    object: props.id,
    extensions: {}
  }

  if (!runstate.submissions) runstate.submissions = {}

  onMounted(async () => {
    const formData = copy(await Agent.state(props.id).then(s => s.formData || []))

    // for formData... look at each item, translate the labels if possible
    if (forcedLanguage) {
      formData.forEach((el,i) => {
        // 1. look at el.name, see if translation exists in forced language
        // but for paragraphs and headers there is no name, so use this janky convention.
        const ref = el.name || `${props.id}_${el.type}_${i}`

        // 2. Inject translations for el.label, failing HARD if not found
        const translation = TRANSLATION_MAP?.[ref]?.[forcedLanguage]
        if (translation) {
          el.label = translation
        } else {
          el.label = `No translation of ${ref} in ${forcedLanguage}`
          console.warn(`No translation of ${ref} in ${forcedLanguage}`)
        }

        // 3. inject translations for any el.values[n].label, failing HARD if not found
        if (el.values) {
          el.values.forEach(({ label, value }, i) => {
            const ref = `${el.name}_values_${value}` // our convention
            const translation = TRANSLATION_MAP?.[ref]?.[forcedLanguage]
            if (translation) {
              el.values[i].label = translation
              label = translation
            } else {
              el.values[i].label = `No translation of ${ref} in ${forcedLanguage}`
              console.warn(`No translation of ${ref} in ${forcedLanguage}`)
            }
          })
        }
      })
    }

    // populate user runstate
    formData
      .forEach(d => {
        if (runstate.submissions[d.name]) {
          d.userData = copy(runstate.submissions[d.name])
        }
      })
    rendererInstance = (
      $(renderer.value)
        .formRender({ formData })
    )
    $(renderer.value).on('input change', 'input, select, textarea', debouncedUpdate)
  })

  function updateRunstate() {
    if (!rendererInstance) return
    rendererInstance
      .userData
      .filter(v => v.userData)
      .forEach(({ name, userData }) => {
        const prevUserData = runstate.submissions[name]
        if (!isEqual(prevUserData, userData)) {

          // this is GIST of it, tracking for user process data state
          let userDataCopy = copy(userData)
          runstate.submissions[name] = userDataCopy

          // this is xAPI writing, mirroring some relevant stuff
          const itemDef = rendererInstance.options.formData.find(el => el.name === name)
          const itemInfoToShoveIntoXapi = { name, userData: userDataCopy }
          const { required, type, values, min, max, multiple } = itemDef
          if (required !== undefined) itemInfoToShoveIntoXapi.required = required
          if (type !== undefined) itemInfoToShoveIntoXapi.type = type
          if (values !== undefined) itemInfoToShoveIntoXapi.values = values
          if (min !== undefined) itemInfoToShoveIntoXapi.min = min
          if (max !== undefined) itemInfoToShoveIntoXapi.max = max
          if (multiple !== undefined) itemInfoToShoveIntoXapi.multiple = multiple

          itemInfoToShoveIntoXapi.label = extractTextFromTag(itemDef.label, "span")
          if (!itemInfoToShoveIntoXapi.label) {
            itemInfoToShoveIntoXapi.label = extractTextFromTag(itemDef.label, "td")
          }
          if (!itemInfoToShoveIntoXapi.label) {
            itemInfoToShoveIntoXapi.label = itemDef.label
          }

          // Keep raw userData as arrays for when it makes sense... 
          // select-multiple and checkbox types
          let response
          if (
            itemDef.type === 'checkbox-group'
            || itemDef.type === 'select' && multiple
          ) {
            response = userDataCopy
          } else {
            const trimmed = userDataCopy[0].trim()
            const num = Number(trimmed)
            response = isNaN(num) || trimmed === "" ? trimmed : num
          }
          runstate.xapi = {
            verb: 'answered',
            object: name,
            result: { response },
            extensions: { item: itemInfoToShoveIntoXapi }
          }
        }
      })
  }

  const debouncedUpdate = debounce(updateRunstate, 300)

  function allRequiredItemsAreAnswered() {
    // for each el in formData, el.userData key DNE at initialization
    // if user  deletes or removes data, key will exist w/value => [""]
    return rendererInstance.options.formData.every(item => {
        if (!item.required) return true
        if (!item.userData?.[0]) return false
        if (!item.userData[0].trim) return false
        return true
      })
  }

  function submit() {
    if (allRequiredItemsAreAnswered()) {
      runstate.xapi = {
        verb: 'completed',
        object: props.id,
        extensions: {}
      }
    } else {
      alert('please answer all required items')
    }
  }

function extractTextFromTag(html, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>(.*?)<\\/${tagName}>`, "i");
  const match = html.match(regex);
  return match ? match[1] : null;
}

</script>

<template>
  <div class="render-wrapper">
    <div ref="renderer" />
    <div>
      <button @click="submit">Next</button>
    </div>
  </div>
</template>

<style scoped>
  .render-wrapper {
    max-width: 360px;
    margin: 0 auto;
    padding: 1rem;
  }
</style>

<style>
  .rendered-form {
    -webkit-user-select: none;  /* Safari, older Chrome, iOS */
    -moz-user-select: none;     /* Firefox */
    -ms-user-select: none;      /* old IE/Edge */
    user-select: none;          /* Standard */
    -webkit-touch-callout: none;
  }

  label.formbuilder-autocomplete-label,
  label.formbuilder-checkbox-group-label,
  label.formbuilder-number-label,
  label.formbuilder-radio-group-label,
  label.formbuilder-select-label,
  label.formbuilder-text-label,
  label.formbuilder-textarea-label {
    font-weight: bold;
  }

.formbuilder-checkbox,
.formbuilder-radio {
  display: flex;
  align-items: flex-start;
  padding: 0.5rem 0 0 0;
}
.rendered-form .formbuilder-checkbox-group input[type=checkbox],
.rendered-form .formbuilder-checkbox-group input[type=radio],
.rendered-form .formbuilder-radio-group input[type=checkbox],
.rendered-form .formbuilder-radio-group input[type=radio]
{
  margin: 5px 10px 0 0;
}

.formbuilder-required {
  flex-shrink: 0;
  margin-left: 4px;
}
</style>
