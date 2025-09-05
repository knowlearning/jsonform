<script setup>
  import { ref, watch, onMounted, reactive } from 'vue'
  import * as jsonpatch from 'fast-json-patch'
  import isEqual from 'lodash/isEqual'
  import debounce from 'lodash/debounce'

  const copy = x => JSON.parse(JSON.stringify(x))

  const props = defineProps({ id: String })

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
          runstate.submissions[name] = copy(userData)
          runstate.xapi = {
            verb: 'answered',
            object: name,
            extensions: { userData }
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
