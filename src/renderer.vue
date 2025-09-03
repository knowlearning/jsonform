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

    const latest = rendererInstance.userData.reduce((acc, cur) => {
      if (cur.userData) acc[cur.name] = cur.userData
      return acc
    }, {})

    // add/update if different
    Object.entries(latest).forEach(([name, nextVal]) => {
      const prevVal = runstate.submissions[name]
      if (!isEqual(prevVal, nextVal)) {
        runstate.submissions[name] = copy(nextVal)
      }
    })

    // remove keys that disappeared
    Object.keys(runstate.submissions).forEach((name) => {
      if (!(name in latest)) delete runstate.submissions[name]
    })
  }

  const debouncedUpdate = debounce(updateRunstate, 300)

</script>

<template>
  <div class="render-wrapper">
    <div ref="renderer" />
    <div>
      <button @click="updateRunstate">Next</button>
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
