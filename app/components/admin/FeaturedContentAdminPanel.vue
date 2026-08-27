<template>
  <section class="space-y-5">
    <div>
      <h2 class="text-2xl font-bold text-white">Featured content</h2>
      <p class="mt-1 text-sm text-zinc-400">Control the five hero slots shared by the website and mobile app.</p>
    </div>

    <p v-if="error" class="rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{{ error }}</p>
    <p v-if="message" class="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 text-sm text-emerald-200">{{ message }}</p>

    <form class="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 lg:grid-cols-2" @submit.prevent="save">
      <label class="grid gap-2 text-sm font-semibold text-zinc-300">
        Content type
        <select v-model="form.content_type" class="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white" @change="searchCandidates">
          <option value="video">Video</option><option value="live">Live stream</option><option value="movie">Movie</option><option value="series">Series</option>
        </select>
      </label>
      <label class="grid gap-2 text-sm font-semibold text-zinc-300">
        Find content
        <input v-model="candidateQuery" class="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white" placeholder="Search by title or channel" @input="queueSearch" />
      </label>
      <label class="grid gap-2 text-sm font-semibold text-zinc-300 lg:col-span-2">
        Selected content
        <select v-model="form.content_id" required class="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white">
          <option value="" disabled>Select content…</option>
          <option v-for="candidate in candidates" :key="candidate.id" :value="candidate.id">{{ candidate.title }}{{ candidate.channel_name ? ` — ${candidate.channel_name}` : '' }}</option>
        </select>
      </label>
      <label v-if="form.content_type === 'live'" class="grid gap-2 text-sm font-semibold text-zinc-300">
        Scheduled start
        <input v-model="form.scheduled_for" type="datetime-local" class="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white" />
      </label>
      <label class="grid gap-2 text-sm font-semibold text-zinc-300">
        Slot (1–5)
        <input v-model.number="form.position" type="number" min="1" max="5" required class="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white" />
      </label>
      <label class="grid gap-2 text-sm font-semibold text-zinc-300">
        Header
        <input v-model="form.header" maxlength="100" class="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white" placeholder="Featured, Premiere, Coming soon…" />
      </label>
      <label class="grid gap-2 text-sm font-semibold text-zinc-300">
        Action button text
        <input v-model="form.action_text" maxlength="40" class="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white" placeholder="Play" />
      </label>
      <label class="grid gap-2 text-sm font-semibold text-zinc-300 lg:col-span-2">
        Custom description
        <textarea v-model="form.description" rows="3" maxlength="500" class="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white" />
      </label>
      <label class="flex items-center gap-3 text-sm text-zinc-200"><input v-model="form.enabled" type="checkbox" class="h-4 w-4 accent-red-600" /> Show this slot</label>
      <label class="flex items-center gap-3 text-sm text-zinc-200"><input v-model="form.notifications_enabled" type="checkbox" class="h-4 w-4 accent-red-600" /> Send featured notifications</label>
      <div class="flex flex-wrap gap-2 lg:col-span-2">
        <button :disabled="saving" class="rounded-xl bg-red-600 px-5 py-2.5 font-bold text-white hover:bg-red-500 disabled:opacity-50">{{ saving ? 'Saving…' : editingId ? 'Save item' : 'Add featured item' }}</button>
        <button v-if="editingId" type="button" class="rounded-xl bg-zinc-800 px-5 py-2.5 font-bold text-white" @click="resetForm">Cancel</button>
      </div>
    </form>

    <div class="grid gap-3">
      <article v-for="item in items" :key="item.id" class="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:flex-row sm:items-center">
        <img :src="mediaURL(item.image_url)" :alt="item.title" class="aspect-video w-full rounded-xl bg-black object-cover sm:w-48" />
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold uppercase tracking-widest text-red-300">Slot {{ item.position + 1 }} · {{ item.content_type }}</p>
          <h3 class="mt-1 truncate text-lg font-bold text-white">{{ item.header || item.title }}</h3>
          <p class="truncate text-sm text-zinc-400">{{ item.title }} · {{ item.channel_name }}</p>
          <p class="mt-2 text-xs text-zinc-500">{{ item.enabled ? 'Visible' : 'Hidden' }} · Notifications {{ item.notifications_enabled ? 'on' : 'off' }}</p>
        </div>
        <div class="flex gap-2"><button class="rounded-lg bg-zinc-800 px-3 py-2 text-sm font-semibold" @click="edit(item)">Edit</button><button class="rounded-lg bg-red-950 px-3 py-2 text-sm font-semibold text-red-200" @click="remove(item)">Delete</button></div>
      </article>
      <p v-if="!loading && !items.length" class="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">No featured content yet.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { createFeaturedContent, deleteFeaturedContent, listAdminFeaturedContent, searchFeaturedCandidates, updateFeaturedContent, type FeaturedCandidate, type FeaturedContent, type FeaturedContentType } from '~/app/service/featured'
import { resolveMediaUrl } from '~/app/utils/media'

const items=ref<FeaturedContent[]>([]), candidates=ref<FeaturedCandidate[]>([]), candidateQuery=ref(''), editingId=ref(''), loading=ref(false), saving=ref(false), error=ref(''), message=ref('')
let timer: ReturnType<typeof setTimeout>|null=null
const blank=()=>({content_type:'video' as FeaturedContentType,content_id:'',header:'',description:'',action_text:'',position:1,enabled:true,notifications_enabled:false,scheduled_for:''})
const form=reactive(blank())
const mediaURL=(value:string)=>resolveMediaUrl(value,'/videos/placeholder-thumbnail.jpg')
const load=async()=>{loading.value=true;try{items.value=await listAdminFeaturedContent()}catch(e:any){error.value=e?.response?.data?.error||'Could not load featured content.'}finally{loading.value=false}}
const searchCandidates=async()=>{form.content_id='';try{candidates.value=await searchFeaturedCandidates(form.content_type,candidateQuery.value)}catch{candidates.value=[]}}
const queueSearch=()=>{if(timer)clearTimeout(timer);timer=setTimeout(searchCandidates,250)}
const resetForm=()=>{Object.assign(form,blank());editingId.value='';candidateQuery.value='';searchCandidates()}
const edit=(item:FeaturedContent)=>{editingId.value=item.id;Object.assign(form,{content_type:item.content_type,content_id:item.content_id,header:item.header,description:item.description,action_text:item.action_text,position:item.position+1,enabled:item.enabled,notifications_enabled:item.notifications_enabled,scheduled_for:item.scheduled_for?new Date(item.scheduled_for).toISOString().slice(0,16):''});candidates.value=[{id:item.content_id,content_type:item.content_type,title:item.title,image_url:item.image_url,channel_id:item.channel_id,channel_name:item.channel_name,scheduled_for:item.scheduled_for}]}
const save=async()=>{saving.value=true;error.value='';message.value='';const payload={...form,position:form.position-1,scheduled_for:form.scheduled_for?new Date(form.scheduled_for).toISOString():undefined};try{if(editingId.value)await updateFeaturedContent(editingId.value,payload);else await createFeaturedContent(payload);message.value='Featured content saved.';resetForm();await load()}catch(e:any){error.value=e?.response?.data?.error||'Could not save featured content.'}finally{saving.value=false}}
const remove=async(item:FeaturedContent)=>{if(!confirm(`Remove “${item.title}” from featured content?`))return;try{await deleteFeaturedContent(item.id);await load()}catch(e:any){error.value=e?.response?.data?.error||'Could not delete featured content.'}}
onMounted(async()=>{await Promise.all([load(),searchCandidates()])})
</script>
