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

  function submit() {
    runstate.xapi = {
      verb: 'completed',
      object: props.id,
      extensions: {}
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
