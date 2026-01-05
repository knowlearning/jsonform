<script setup>
import { ref, reactive, onMounted } from 'vue'
import { vueEmbedComponent } from '@knowlearning/agents/vue.js'
import { validate as isUUID } from 'uuid'
import Builder from './builder.vue'
import Renderer from './renderer.vue'
import FormSelector from './form-selector.vue'
import Loading from './loading.vue'
import exportQuestionnareData from './exportQuestionnareData.js'
import extractItemValues from './extractItemValues.js'

const activeId = ref(null)

const myLocalForms = reactive({})
let myKLForms = null

const embedded = Agent.embedded
const updated = ref(Date.now())
const ownerIsUser = ref(false)
const validPath = ref(null)
const loading = ref(true)
const pathId = ref(window.location.pathname.slice(1))
const questionnaireIdInput= ref('')

const FORM_TYPE = "application/json;type=kl-json-form&version=1.0.1"

onMounted(async () => {

  myKLForms = await Agent.state('my-forms')
  const myACTIVEKLForms = Object.fromEntries(
    Object.entries(myKLForms).filter(([_, v]) => v)
  )
  Object.assign(myLocalForms, myACTIVEKLForms) 

  const { auth: { user } } = await Agent.environment()
  validPath.value = isUUID(pathId.value)
  if (validPath.value) {
    const md = await Agent.metadata(pathId.value)
    ownerIsUser.value = md.owner === user
    activeId.value = md.id
  }
  loading.value = false
})

async function create(formData = [], name = "New Form") {
  const newId = Agent.uuid()
  const state = await Agent.state(newId)
  state.name = name
  state.formData = formData
  const md = await Agent.metadata(newId)
  md.active_type = FORM_TYPE

  myKLForms[newId] = true
  myLocalForms[newId] = true

  await Agent.synced()
  window.location = `/${newId}`
}

function archive(id) {
  myKLForms[id] = false
  myLocalForms[id] = false
  window.location = '/'
}

function navToFormId(id) {
  window.location = `/${id}`
}

async function copy(id) {
  const { formData = [], name = "New Form" } = await Agent.state(id)
  create(
    JSON.parse(JSON.stringify(formData)),
    `Copy of ${name}`
  )
}

</script>

<template>
  <Suspense>
    <div v-if="pathId === 'export'">
      Enter ids on separate lines for all questionnaires to include in export:
      <br>
      <textarea
        v-model="questionnaireIdInput"
        style="
          width: 90vw;
          min-height: 50vh;
        "
      />
      <br>
      <button @click="exportQuestionnareData(questionnaireIdInput)">Export Questionnaire Data</button>
      <button @click="extractItemValues(questionnaireIdInput)">Export Item Values</button>

    </div>
    <Loading v-else-if="loading" v-model="loading"  />
    <Renderer v-else-if="embedded && validPath"
      :key="updated"
      :id="activeId"
    />
    <div v-else-if="embedded && !validPath">Invalid Path</div>
    <div id="wrapper" v-else>
      <div id="select-id">
        <FormSelector
          :forms="myLocalForms"
          :activeId="activeId"
          @update="navToFormId"
        />
        <button @click="create()">Create New Form</button>
      </div>
      <hr>
      <div
        id="bottom-with-grid-for-columns"
        v-if="validPath && activeId"
      >
        <h3>Editor</h3>
        <h3>Preview</h3>

        <Builder
          v-if="!embedded && ownerIsUser"
          :id="activeId"
          @update="updated = Date.now()"
          @archive="archive"
        />
        <div v-else></div> <!-- Placeholder for Grid -->
        <div id="right-col">
          <button
            v-if="!embedded && !ownerIsUser"
            @click="copy(activeId)"
          >
            Make my own copy to edit
          </button>
          <vueEmbedComponent
            :key="updated"
            :id="activeId"
          />
        </div>
      </div>
    </div>
  </Suspense>
</template>

<style scoped>
#select-id { display: flex; }
#select-id > * { margin-right: 2em; }
#container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
#bottom-with-grid-for-columns {
  display: grid;
  grid-template-columns: 2fr 1fr;

}
#bottom-with-grid-for-columns h3 {
  margin: 0;
}
</style>
