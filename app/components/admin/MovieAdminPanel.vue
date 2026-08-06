<template>
  <div class="space-y-6">
    <div>
      <div class="flex items-center gap-3">
        <h2 class="text-2xl font-bold text-white">{{ t('movieAdmin.title') }}</h2>
        <AdminHelpButton
          :title="t('movieAdmin.help.title')"
          :body="t('movieAdmin.help.body')"
          :close-label="t('common.close')"
        />
      </div>
      <p class="mt-1 text-sm text-gray-400">{{ t('movieAdmin.subtitle') }}</p>
    </div>

    <div class="rounded-lg border border-zinc-700 bg-zinc-900 p-5">
      <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.resumeExisting') }}</label>
      <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_9rem]">
        <select v-model="selectedMovieId" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" @change="selectExistingMovie">
          <option value="">{{ t('movieAdmin.createNewOption') }}</option>
          <option v-for="item in adminMovies" :key="item.id" :value="item.id">
            {{ item.title }}{{ item.video_id ? ` · ${t('movieAdmin.linkedBadge')}` : '' }}
          </option>
        </select>
        <button type="button" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="startNewMovie">
          {{ t('movieAdmin.newMovie') }}
        </button>
      </div>
    </div>

    <div v-if="movieProgressMessage" class="rounded border border-blue-500/30 bg-blue-950/40 p-3 text-sm text-blue-100">{{ movieProgressMessage }}</div>
    <div v-if="movieError" class="rounded border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-100">{{ movieError }}</div>

    <div>
      <form class="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-5" @submit.prevent="handleMovieSubmit">
        <section class="space-y-3 rounded border border-zinc-800 bg-black/30 p-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-end">
            <div class="min-w-0 flex-1">
              <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.metadata.title') }}</label>
              <input v-model="metadataQuery" :placeholder="t('movieAdmin.metadata.placeholder')" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" @keydown.enter.prevent="searchMovieMetadata" />
            </div>
            <button type="button" :disabled="metadataSearching || !metadataQuery.trim()" class="rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" @click="searchMovieMetadata">
              {{ metadataSearching ? t('movieAdmin.metadata.searching') : t('movieAdmin.metadata.search') }}
            </button>
          </div>

          <div v-if="metadataResults.length" class="grid gap-3 md:grid-cols-2">
            <article v-for="result in metadataResults" :key="`${result.source}-${result.source_id}`" class="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded border border-zinc-800 bg-zinc-950 p-3">
              <img v-if="result.poster_url" :src="result.poster_url" :alt="result.title" class="aspect-[2/3] w-full rounded object-cover" />
              <div v-else class="aspect-[2/3] rounded bg-zinc-800" />
              <div class="min-w-0">
                <h4 class="line-clamp-1 text-sm font-semibold text-white">{{ result.title }}</h4>
                <p class="mt-1 text-xs text-gray-500">{{ result.release_year || t('movieAdmin.library.unknownDate') }} · {{ result.genres.slice(0, 2).join(', ') }}</p>
                <p class="mt-2 line-clamp-2 text-xs text-gray-400">{{ result.synopsis }}</p>
                <button type="button" class="mt-3 rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600" @click="applyMovieMetadata(result)">
                  {{ t('movieAdmin.metadata.apply') }}
                </button>
              </div>
            </article>
          </div>
        </section>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.title') }}</label>
            <input v-model="movieForm.title" required class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.slug') }}</label>
            <input v-model="movieForm.slug" :placeholder="t('movieAdmin.placeholders.slug')" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.primaryGenre') }}</label>
            <input v-model="movieForm.genre" required class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.releaseYear') }}</label>
            <input v-model.number="movieForm.releaseYear" min="0" type="number" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.synopsis') }}</label>
          <textarea v-model="movieForm.synopsis" rows="4" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.genres') }}</label>
            <input v-model="movieForm.genres" :placeholder="t('movieAdmin.placeholders.genres')" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.directors') }}</label>
            <input v-model="movieForm.directors" :placeholder="t('movieAdmin.placeholders.commaSeparated')" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.cast') }}</label>
            <input v-model="movieForm.cast" :placeholder="t('movieAdmin.placeholders.commaSeparated')" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.posterImage') }}</label>
            <input type="file" accept="image/*" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onMovieImageSelected($event, 'poster')" />
            <div v-if="movieForm.posterUrl" class="mt-3 overflow-hidden rounded border border-zinc-800 bg-black/40">
              <img :src="movieForm.posterUrl" :alt="movieForm.title || t('movieAdmin.fields.posterImage')" class="aspect-[2/3] max-h-64 w-full object-contain" />
            </div>
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.backdropImage') }}</label>
            <input type="file" accept="image/*" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onMovieImageSelected($event, 'backdrop')" />
            <div v-if="movieForm.backdropUrl" class="mt-3 overflow-hidden rounded border border-zinc-800 bg-black/40">
              <img :src="movieForm.backdropUrl" :alt="movieForm.title || t('movieAdmin.fields.backdropImage')" class="aspect-video max-h-64 w-full object-cover" />
            </div>
          </div>
        </div>

        <label class="flex items-center gap-3 rounded border border-zinc-700 bg-zinc-800 p-3 text-sm text-gray-300">
          <input v-model="movieForm.isFeatured" type="checkbox" class="h-4 w-4 accent-red-600" />
          {{ t('movieAdmin.featuredToggle') }}
        </label>

        <div v-if="movieVideoId || trailerVideoId" class="grid gap-3 rounded border border-zinc-800 bg-black/30 p-3 text-xs md:grid-cols-2">
          <div v-if="movieVideoId" class="min-w-0">
            <span class="font-semibold uppercase tracking-wide text-gray-500">{{ t('movieAdmin.ids.movieVideo') }}</span>
            <code class="mt-1 block select-all break-all font-mono text-gray-200">{{ movieVideoId }}</code>
          </div>
          <div v-if="trailerVideoId" class="min-w-0">
            <span class="font-semibold uppercase tracking-wide text-gray-500">{{ t('movieAdmin.ids.trailerVideo') }}</span>
            <code class="mt-1 block select-all break-all font-mono text-gray-200">{{ trailerVideoId }}</code>
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <button type="submit" :disabled="movieCreating || movieSaving || movieDeleting" class="rounded bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
            {{ createdMovieId ? (movieSaving ? t('common.saving') : t('movieAdmin.actions.saveMovieDetails')) : (movieCreating ? t('movieAdmin.actions.creatingMovie') : t('movieAdmin.actions.createMovie')) }}
          </button>
          <button v-if="createdMovieId" type="button" :disabled="movieCreating || movieSaving || movieDeleting" class="rounded bg-red-950 px-5 py-2.5 font-semibold text-red-100 ring-1 ring-red-800 transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50" @click="deleteCurrentMovie">
            {{ movieDeleting ? t('common.deleting') : t('movieAdmin.actions.deleteMovie') }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="createdMovieId && movieVideoId" class="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold text-white">Audio tracks</h3>
          <p class="mt-1 text-sm text-gray-400">Edit audio labels/languages, choose the default, or add/replace alternate audio tracks.</p>
        </div>
        <button type="button" class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600" @click="loadMovieAudioTracks">
          {{ t('common.refresh') }}
        </button>
      </div>

      <div v-if="movieAudioTracks.length" class="space-y-2">
        <div v-for="track in movieAudioTracks" :key="track.id" class="flex flex-wrap items-center justify-between gap-3 rounded bg-zinc-950 px-3 py-2">
          <div class="grid min-w-0 flex-1 gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <input v-model="track.language" placeholder="en" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-gray-500" />
            <input v-model="track.label" placeholder="English" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-gray-500" />
            <p class="text-xs text-gray-500 sm:col-span-2">{{ track.language || 'und' }} · {{ track.default ? t('movieAdmin.subtitles.default') : t('movieAdmin.subtitles.optional') }} · {{ track.delay_ms || 0 }}ms</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button v-if="!track.default || hasDuplicateAudioDefaults" type="button" :disabled="audioSaving" class="rounded bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50" @click="makeAudioDefault(track)">
              {{ track.default ? t('movieAdmin.subtitles.keepOnlyDefault') : t('movieAdmin.subtitles.makeDefault') }}
            </button>
            <button type="button" :disabled="audioSaving" class="rounded bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50" @click="saveAudioMetadata(track)">
              Save title
            </button>
            <button type="button" :disabled="audioDownloadingId === track.id" class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50" @click="downloadAudioTrack(track)">
              {{ audioDownloadingId === track.id ? t('common.preparing') : t('videoEditor.audio.downloadWav') }}
            </button>
            <button type="button" :disabled="audioSaving" class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50" @click="startReplaceAudio(track)">
              {{ t('movieAdmin.subtitles.replace') }}
            </button>
            <button type="button" :disabled="audioSaving" class="rounded bg-red-900 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50" @click="removeAudioTrack(track)">
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
      <p v-else class="rounded border border-zinc-800 bg-black/30 px-4 py-6 text-sm text-gray-500">No alternate audio tracks found.</p>

      <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem_10rem_8rem_8rem]">
        <input type="file" accept="audio/*,video/*,.mka,.mkv,.mp4,.aac,.mp3,.wav,.flac,.m4a" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onAudioFileSelected" />
        <input v-model="audioForm.language" placeholder="en" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
        <input v-model="audioForm.label" placeholder="English" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
        <label class="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-gray-300">
          <input v-model="audioForm.isDefault" type="checkbox" class="h-4 w-4 accent-red-600" />
          {{ t('movieAdmin.subtitles.default') }}
        </label>
        <input v-model.number="audioForm.delayMs" type="number" step="100" placeholder="Delay ms" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
      </div>
      <div v-if="audioForm.file || audioSaving" class="rounded border border-zinc-800 bg-black/30 px-3 py-2 text-xs text-gray-300">
        <p v-if="audioForm.file">
          Selected: <span class="font-semibold text-white">{{ audioForm.file.name }}</span>
          <span class="text-gray-500">({{ formatFileSize(audioForm.file.size) }})</span>
        </p>
        <div v-if="audioSaving" class="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div class="h-full rounded-full bg-red-600 transition-all" :style="{ width: `${audioUploadProgress}%` }" />
        </div>
        <p v-if="audioSaving" class="mt-1 text-gray-400">{{ audioUploadProgress }}%</p>
      </div>
      <p class="text-xs text-gray-500">Audio delay is applied when adding/replacing a file. Existing encoded tracks can only edit title/language/default.</p>
      <div class="flex flex-wrap gap-2">
        <button type="button" :disabled="(!audioForm.file && !audioForm.trackId) || audioSaving" class="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50" @click="saveAudioTrack()">
          {{ audioSaving ? `${audioUploadProgress}%` : audioForm.trackId ? 'Save audio track' : 'Add audio track' }}
        </button>
        <button type="button" :disabled="!audioForm.file || audioSaving" class="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" @click="saveAudioTrack(true)">
          Local upload
        </button>
        <button v-if="audioForm.trackId" type="button" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="cancelReplaceAudio">
          {{ t('common.cancel') }}
        </button>
      </div>
    </div>

    <div v-if="createdMovieId" class="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-5">
      <div>
        <h3 class="text-lg font-semibold text-white">{{ t('movieAdmin.trailer.title') }}</h3>
        <p class="mt-1 text-sm text-gray-400">{{ t('movieAdmin.trailer.body') }}</p>
      </div>
      <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem]">
        <input v-model="trailerForm.title" :placeholder="t('movieAdmin.placeholders.trailerTitle')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        <input type="file" accept="video/*" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onTrailerFileSelected" />
        <button type="button" :disabled="!trailerFile || trailerUploading" class="rounded bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50" @click="uploadTrailer">
          {{ trailerUploading ? `${trailerProgress}%` : t('movieAdmin.actions.uploadTrailer') }}
        </button>
      </div>
    </div>

    <div v-if="createdMovieId" class="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-5">
      <div>
        <div class="flex items-center gap-3">
          <h3 class="text-lg font-semibold text-white">{{ t('movieAdmin.fullMovie.title') }}</h3>
          <AdminHelpButton
            :title="t('movieAdmin.fullMovie.helpTitle')"
            :body="t('movieAdmin.fullMovie.helpBody')"
            :close-label="t('common.close')"
          />
        </div>
        <p class="mt-1 text-sm text-gray-400">{{ t('movieAdmin.fullMovie.body') }}</p>
      </div>
      <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_repeat(3,minmax(0,10rem))]">
        <input v-model="movieVideoTitle" :placeholder="t('movieAdmin.placeholders.movieVideoTitle')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        <input type="file" accept="video/*" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onMovieFileSelected" />
        <button type="button" :disabled="!movieFile || movieUploading" class="rounded bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50" @click="uploadMovieVideo()">
          {{ movieUploading ? `${movieUploadProgress}%` : (movieVideoId ? t('movieAdmin.actions.replaceUpload') : t('movieAdmin.actions.upload')) }}
        </button>
        <button type="button" :disabled="!movieFile || movieUploading" class="rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" @click="uploadMovieVideo(true)">
          {{ t('movieAdmin.actions.localUpload') }}
        </button>
        <button type="button" :disabled="!movieVideoId || movieAttaching" class="rounded bg-green-700 px-4 py-2 font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50" @click="attachMovieVideo">
          {{ movieAttaching ? t('movieAdmin.actions.attaching') : t('movieAdmin.actions.attachMovie') }}
        </button>
      </div>
    </div>

    <div v-if="createdMovieId && movieVideoId" class="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-semibold text-white">{{ t('movieAdmin.subtitles.title') }}</h3>
            <AdminHelpButton
              :title="t('movieAdmin.subtitles.helpTitle')"
              :body="t('movieAdmin.subtitles.helpBody')"
              :close-label="t('common.close')"
            />
          </div>
          <p class="mt-1 text-sm text-gray-400">{{ t('movieAdmin.subtitles.body') }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-if="needsSubtitleDefaultFix"
            type="button"
            :disabled="subtitleSaving"
            class="rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            @click="fixSubtitleDefaults"
          >
            {{ t('movieAdmin.subtitles.fixDefaults') }}
          </button>
          <button type="button" class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600" @click="loadMovieSubtitles">
            {{ t('common.refresh') }}
          </button>
        </div>
      </div>

      <div class="grid gap-3 rounded border border-zinc-800 bg-black/30 p-3 sm:grid-cols-[minmax(0,1fr)_10rem_10rem] sm:items-end">
        <div>
          <label class="text-xs font-semibold uppercase tracking-wide text-gray-500">{{ t('movieAdmin.subtitles.globalDelay') }}</label>
          <p class="mt-1 text-xs text-gray-500">{{ t('movieAdmin.subtitles.globalDelayHelp') }}</p>
        </div>
        <input v-model.number="globalSubtitleDelayMs" type="number" step="100" :placeholder="t('movieAdmin.subtitles.delayMs')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
        <button type="button" :disabled="!movieSubtitles.length || subtitleSaving || globalSubtitleDelaySaving" class="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50" @click="applyGlobalSubtitleDelay">
          {{ globalSubtitleDelaySaving ? t('common.saving') : t('movieAdmin.subtitles.applyGlobalDelay') }}
        </button>
      </div>

      <div v-if="movieSubtitles.length" class="space-y-2">
        <div v-for="track in movieSubtitles" :key="track.id" class="flex flex-col gap-3 rounded bg-zinc-950 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div class="grid min-w-0 flex-1 gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <input v-model="track.language" placeholder="en" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-gray-500" />
            <input v-model="track.label" placeholder="English" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-gray-500" />
            <p class="text-xs text-gray-500 sm:col-span-2">{{ track.language || 'und' }} · {{ track.default ? t('movieAdmin.subtitles.default') : t('movieAdmin.subtitles.optional') }}</p>
          </div>
          <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <input v-model.number="track.delay_ms" type="number" step="100" :placeholder="t('movieAdmin.subtitles.delayMs')" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-gray-500 sm:w-28" />
            <button type="button" :disabled="subtitleSaving" class="rounded bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50" @click="saveSubtitleMetadata(track)">
              Save title
            </button>
            <button v-if="!track.default || hasDuplicateSubtitleDefaults" type="button" :disabled="subtitleSaving" class="rounded bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50" @click="makeSubtitleDefault(track)">
              {{ track.default ? t('movieAdmin.subtitles.keepOnlyDefault') : t('movieAdmin.subtitles.makeDefault') }}
            </button>
            <button type="button" :disabled="subtitleSaving" class="rounded bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50" @click="saveSubtitleDelay(track)">
              {{ t('movieAdmin.subtitles.saveDelay') }}
            </button>
            <a
              :href="subtitleDownloadUrl(track)"
              :download="subtitleDownloadName(track)"
              class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600"
            >
              {{ t('movieAdmin.subtitles.download') }}
            </a>
            <button type="button" :disabled="subtitleSaving" class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50" @click="startReplaceSubtitle(track)">
              {{ t('movieAdmin.subtitles.replace') }}
            </button>
            <button type="button" :disabled="subtitleSaving" class="rounded bg-red-900 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50" @click="removeSubtitle(track)">
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
      <p v-else class="rounded border border-zinc-800 bg-black/30 px-4 py-6 text-sm text-gray-500">{{ t('movieAdmin.subtitles.empty') }}</p>

      <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem_10rem_8rem_8rem]">
        <input type="file" accept=".srt,.ass,.vtt,text/vtt" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onSubtitleFileSelected" />
        <input v-model="subtitleForm.language" placeholder="en" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
        <input v-model="subtitleForm.label" placeholder="English" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
        <label class="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-gray-300">
          <input v-model="subtitleForm.isDefault" type="checkbox" class="h-4 w-4 accent-red-600" />
          {{ t('movieAdmin.subtitles.default') }}
        </label>
        <input v-model.number="subtitleForm.delayMs" type="number" step="100" :placeholder="t('movieAdmin.subtitles.delayMs')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" :disabled="(!subtitleForm.file && !subtitleForm.trackId) || subtitleSaving" class="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50" @click="saveSubtitle">
          {{ subtitleSaving ? t('common.saving') : subtitleForm.trackId ? t('movieAdmin.subtitles.saveSubtitle') : t('movieAdmin.subtitles.addSubtitle') }}
        </button>
        <button v-if="subtitleForm.trackId" type="button" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="cancelReplaceSubtitle">
          {{ t('common.cancel') }}
        </button>
      </div>
    </div>

    <div v-if="createdMovieId" class="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-5">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 class="text-lg font-semibold text-white">{{ t('movieAdmin.library.title') }}</h3>
          <p class="mt-1 text-sm text-gray-400">{{ t('movieAdmin.library.body') }}</p>
        </div>
        <button type="button" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="loadExistingMovieVideos">
          {{ t('movieAdmin.actions.refreshLibrary') }}
        </button>
      </div>

      <input
        v-model="existingVideosQuery"
        :placeholder="t('movieAdmin.placeholders.searchLibrary')"
        class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />

      <div v-if="existingVideosLoading" class="rounded border border-zinc-800 bg-black/30 px-4 py-6 text-sm text-gray-400">
        {{ t('movieAdmin.library.loading') }}
      </div>

      <div v-else-if="!filteredExistingMovieVideos.length" class="rounded border border-zinc-800 bg-black/30 px-4 py-6 text-sm text-gray-400">
        {{ t('movieAdmin.library.empty') }}
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="video in filteredExistingMovieVideos" :key="video.id" class="overflow-hidden rounded-lg border border-zinc-800 bg-black/30">
          <div class="aspect-video overflow-hidden bg-zinc-950">
            <img v-if="video.thumbnail_url" :src="withBaseUrl(video.thumbnail_url)" :alt="video.title" class="h-full w-full object-cover" />
            <div v-else class="flex h-full items-center justify-center text-sm text-gray-500">{{ t('playlists.noThumbnail') }}</div>
          </div>
          <div class="space-y-3 p-4">
            <div>
              <h4 class="line-clamp-2 text-sm font-semibold text-white">{{ video.title }}</h4>
              <p class="mt-1 text-xs text-gray-500">
                {{ video.hidden ? t('movieAdmin.library.hidden') : t('movieAdmin.library.public') }} · {{ formatDate(video.created_at) }}
              </p>
              <p class="mt-1 line-clamp-1 text-xs text-gray-400">
                {{ video.channel_name || t('movieAdmin.library.unknownChannel') }}
                <span v-if="video.owner_username" class="text-gray-500"> · {{ t('movieAdmin.library.owner') }} {{ video.owner_username }}</span>
              </p>
              <code class="mt-2 block select-all break-all text-[11px] text-gray-400">{{ video.id }}</code>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                :disabled="trailerAttaching || trailerVideoId === video.id"
                class="rounded bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                @click="linkExistingTrailer(video)"
              >
                {{ trailerVideoId === video.id ? t('movieAdmin.actions.trailerLinked') : (trailerAttaching ? t('movieAdmin.actions.linking') : t('movieAdmin.actions.useAsTrailer')) }}
              </button>
              <button
                type="button"
                :disabled="movieAttaching || movieVideoId === video.id"
                class="rounded bg-green-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                @click="linkExistingMovie(video)"
              >
                {{ movieVideoId === video.id ? t('movieAdmin.actions.movieLinked') : (movieAttaching ? t('movieAdmin.actions.linking') : t('movieAdmin.actions.useAsMovie')) }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalUploadBaseURL } from '~/app/composables/useLocalUploadBaseURL'
import { searchMediaMetadata, type MediaMetadataResult } from '~/app/service/mediaMetadata'
import { uploadVideo } from '~/app/service/upload'
import { createMovie, deleteMovie, deleteMovieAudioTrack, deleteMovieSubtitle, downloadMovieAudioTrackWAV, getMovie, GILTUBE_MOVIES_CHANNEL_ID, listMovieAudioTracks, listMovieSubtitles, listMovies, setMovieTrailer, setMovieVideo, updateMovie, uploadMovieAudioTrack, uploadMovieSubtitle } from '~/app/service/movies'
import { getAdminVideos } from '~/app/service/videos'
import { resolveMediaUrl } from '~/app/utils/media'
import AdminHelpButton from './AdminHelpButton.vue'

const localUploadBaseURL = useLocalUploadBaseURL()
const moviesChannelId = GILTUBE_MOVIES_CHANNEL_ID
const { t } = useI18n()

type SubtitleTrack = {
  id: string
  label: string
  language: string
  uri: string
  default: boolean
  delay_ms: number
}

type AudioTrack = SubtitleTrack

const adminMovies = ref<any[]>([])
const selectedMovieId = ref('')
const createdMovieId = ref('')
const movieCreating = ref(false)
const movieSaving = ref(false)
const movieDeleting = ref(false)
const movieError = ref('')
const movieProgressMessage = ref('')
const trailerUploading = ref(false)
const trailerProgress = ref(0)
const trailerFile = ref<File | null>(null)
const trailerVideoId = ref('')
const trailerAttaching = ref(false)
const movieFile = ref<File | null>(null)
const movieUploading = ref(false)
const movieUploadProgress = ref(0)
const movieAttaching = ref(false)
const movieVideoId = ref('')
const movieVideoTitle = ref('')
const existingMovieVideos = ref<any[]>([])
const existingVideosLoading = ref(false)
const existingVideosQuery = ref('')
const metadataQuery = ref('')
const metadataSearching = ref(false)
const metadataResults = ref<MediaMetadataResult[]>([])
const movieSubtitles = ref<SubtitleTrack[]>([])
const movieAudioTracks = ref<AudioTrack[]>([])
const subtitleSaving = ref(false)
const globalSubtitleDelaySaving = ref(false)
const globalSubtitleDelayMs = ref(0)
const audioSaving = ref(false)
const audioDownloadingId = ref('')
const audioUploadProgress = ref(0)
const subtitleForm = ref({
  file: null as File | null,
  trackId: '',
  label: '',
  language: 'en',
  isDefault: false,
  delayMs: 0,
})
const audioForm = ref({
  file: null as File | null,
  trackId: '',
  label: '',
  language: 'en',
  isDefault: false,
  delayMs: 0,
})

const trailerForm = ref({
  title: '',
})

const movieForm = ref({
  title: '',
  slug: '',
  synopsis: '',
  genre: t('movieAdmin.defaults.genre'),
  genres: '',
  directors: '',
  cast: '',
  releaseYear: 0,
  isFeatured: false,
  poster: null as File | null,
  backdrop: null as File | null,
  posterUrl: '',
  backdropUrl: '',
})

const listToText = (value: unknown) => Array.isArray(value) ? value.join(', ') : ''
const withBaseUrl = (url: string) => {
  return resolveMediaUrl(url)
}
const formatDate = (value: string) => {
  if (!value) return t('movieAdmin.library.unknownDate')
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}
const filteredExistingMovieVideos = computed(() => {
  const query = existingVideosQuery.value.trim().toLowerCase()
  if (!query) return existingMovieVideos.value
  return existingMovieVideos.value.filter((video) =>
    String(video.title || '').toLowerCase().includes(query) ||
    String(video.description || '').toLowerCase().includes(query) ||
    String(video.id || '').toLowerCase().includes(query) ||
    String(video.channel_name || '').toLowerCase().includes(query) ||
    String(video.owner_username || '').toLowerCase().includes(query)
  )
})
const hasDuplicateSubtitleDefaults = computed(() => movieSubtitles.value.filter(track => track.default).length > 1)
const needsSubtitleDefaultFix = computed(() => hasDuplicateSubtitleDefaults.value || movieSubtitles.value.filter(track => track.default).length === 0)
const hasDuplicateAudioDefaults = computed(() => movieAudioTracks.value.filter(track => track.default).length > 1)

const getMoviesCategoryId = () => {
  if (typeof window === 'undefined') return ''
  try {
    const stored = localStorage.getItem('categories')
    if (!stored) return ''
    const categories = JSON.parse(stored)
    return categories.find((item: any) => item.slug === 'movies')?.id || ''
  } catch {
    return ''
  }
}

const resetMovieWorkspace = () => {
  createdMovieId.value = ''
  selectedMovieId.value = ''
  trailerVideoId.value = ''
  movieVideoId.value = ''
  movieVideoTitle.value = ''
  existingVideosQuery.value = ''
  trailerForm.value.title = ''
  trailerFile.value = null
  movieFile.value = null
  trailerProgress.value = 0
  movieUploadProgress.value = 0
  metadataQuery.value = ''
  metadataResults.value = []
  movieForm.value = {
    title: '',
    slug: '',
    synopsis: '',
    genre: t('movieAdmin.defaults.genre'),
    genres: '',
    directors: '',
    cast: '',
    releaseYear: 0,
    isFeatured: false,
    poster: null,
    backdrop: null,
    posterUrl: '',
    backdropUrl: '',
  }
  movieError.value = ''
  movieProgressMessage.value = ''
  movieSubtitles.value = []
  movieAudioTracks.value = []
  globalSubtitleDelayMs.value = 0
  subtitleForm.value = {
    file: null,
    trackId: '',
    label: '',
    language: 'en',
    isDefault: false,
    delayMs: 0,
  }
  audioForm.value = {
    file: null,
    trackId: '',
    label: '',
    language: 'en',
    isDefault: false,
    delayMs: 0,
  }
}

const loadMoviesAdminData = async () => {
  const data = await listMovies()
  adminMovies.value = data.movies || []
}

const loadExistingMovieVideos = async () => {
  existingVideosLoading.value = true
  try {
    const videos = await getAdminVideos({ limit: 1000 })
    existingMovieVideos.value = Array.isArray(videos) ? videos : []
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.errors.loadLibrary')
  } finally {
    existingVideosLoading.value = false
  }
}

const hydrateMovieWorkspace = async (movieId: string) => {
  if (!movieId) {
    resetMovieWorkspace()
    return
  }
  movieError.value = ''
  movieProgressMessage.value = ''
  try {
    const detail = await getMovie(movieId)
    const item = detail.movie
    createdMovieId.value = item.id
    selectedMovieId.value = item.id
    trailerVideoId.value = item.trailer_video_id || ''
    movieVideoId.value = item.video_id || ''
    movieVideoTitle.value = item.video?.title || item.title || ''
    movieForm.value = {
      title: item.title || '',
      slug: item.slug || '',
      synopsis: item.synopsis || '',
      genre: item.genre || t('movieAdmin.defaults.genre'),
      genres: listToText(item.genres),
      directors: listToText(item.directors),
      cast: listToText(item.cast),
      releaseYear: item.release_year || 0,
      isFeatured: !!item.is_featured,
      poster: null,
      backdrop: null,
      posterUrl: item.poster_url || '',
      backdropUrl: item.backdrop_url || '',
    }
    trailerForm.value.title = `${movieForm.value.title} ${t('movieAdmin.defaults.trailerSuffix')}`
    trailerFile.value = null
    movieFile.value = null
    trailerProgress.value = 0
    movieUploadProgress.value = 0
    await loadMovieSubtitles()
    await loadMovieAudioTracks()
    movieProgressMessage.value = t('movieAdmin.messages.loaded', { title: movieForm.value.title })
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.errors.loadMovie')
  }
}

const startNewMovie = () => {
  resetMovieWorkspace()
}

const selectExistingMovie = async () => {
  await hydrateMovieWorkspace(selectedMovieId.value)
}

const onMovieImageSelected = (event: Event, kind: 'poster' | 'backdrop') => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  if (kind === 'poster') {
    movieForm.value.poster = file
  } else {
    movieForm.value.backdrop = file
  }
}

const handleCreateMovie = async () => {
  movieError.value = ''
  movieProgressMessage.value = ''
  if (!movieForm.value.title.trim()) {
    movieError.value = t('movieAdmin.errors.titleRequired')
    return
  }
  movieCreating.value = true
  try {
    const created = await createMovie({
      title: movieForm.value.title,
      slug: movieForm.value.slug,
      synopsis: movieForm.value.synopsis,
      genre: movieForm.value.genre,
      genres: movieForm.value.genres,
      directors: movieForm.value.directors,
      cast: movieForm.value.cast,
      releaseYear: movieForm.value.releaseYear,
      channelId: moviesChannelId,
      isFeatured: movieForm.value.isFeatured,
      poster: movieForm.value.poster,
      backdrop: movieForm.value.backdrop,
      posterUrl: movieForm.value.posterUrl,
      backdropUrl: movieForm.value.backdropUrl,
    })
    createdMovieId.value = created.id
    selectedMovieId.value = created.id
    trailerForm.value.title = `${movieForm.value.title} ${t('movieAdmin.defaults.trailerSuffix')}`
    movieVideoTitle.value = movieForm.value.title
    await loadMoviesAdminData()
    movieProgressMessage.value = t('movieAdmin.messages.created')
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.errors.createMovie')
  } finally {
    movieCreating.value = false
  }
}

const searchMovieMetadata = async () => {
  const query = metadataQuery.value.trim()
  if (!query) return
  metadataSearching.value = true
  movieError.value = ''
  try {
    const data = await searchMediaMetadata('movie', query)
    metadataResults.value = data.results || []
    if (!metadataResults.value.length) {
      movieProgressMessage.value = t('movieAdmin.metadata.empty')
    }
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.metadata.error')
  } finally {
    metadataSearching.value = false
  }
}

const applyMovieMetadata = (result: MediaMetadataResult) => {
  movieForm.value.title = result.title || movieForm.value.title
  movieForm.value.synopsis = result.synopsis || movieForm.value.synopsis
  movieForm.value.genre = result.genre || movieForm.value.genre
  movieForm.value.genres = result.genres.join(', ')
  movieForm.value.directors = result.directors.join(', ')
  movieForm.value.cast = result.cast.join(', ')
  movieForm.value.releaseYear = result.release_year || movieForm.value.releaseYear
  movieForm.value.posterUrl = result.poster_url || movieForm.value.posterUrl
  movieForm.value.backdropUrl = result.backdrop_url || movieForm.value.backdropUrl
  movieForm.value.poster = null
  movieForm.value.backdrop = null
  movieVideoTitle.value = movieVideoTitle.value || result.title
  trailerForm.value.title = `${result.title} ${t('movieAdmin.defaults.trailerSuffix')}`
  movieProgressMessage.value = t('movieAdmin.metadata.applied', { title: result.title })
}

const saveMovieDetails = async () => {
  if (!createdMovieId.value) return
  movieError.value = ''
  movieProgressMessage.value = ''
  if (!movieForm.value.title.trim()) {
    movieError.value = t('movieAdmin.errors.titleRequired')
    return
  }
  movieSaving.value = true
  try {
    const updated = await updateMovie(createdMovieId.value, {
      title: movieForm.value.title,
      slug: movieForm.value.slug,
      synopsis: movieForm.value.synopsis,
      genre: movieForm.value.genre,
      genres: movieForm.value.genres,
      directors: movieForm.value.directors,
      cast: movieForm.value.cast,
      releaseYear: movieForm.value.releaseYear,
      channelId: moviesChannelId,
      isFeatured: movieForm.value.isFeatured,
      poster: movieForm.value.poster,
      backdrop: movieForm.value.backdrop,
      posterUrl: movieForm.value.posterUrl,
      backdropUrl: movieForm.value.backdropUrl,
      videoId: movieVideoId.value,
    })
    if (updated.poster_url) movieForm.value.posterUrl = updated.poster_url
    if (updated.backdrop_url) movieForm.value.backdropUrl = updated.backdrop_url
    movieForm.value.poster = null
    movieForm.value.backdrop = null
    await loadMoviesAdminData()
    await hydrateMovieWorkspace(createdMovieId.value)
    movieProgressMessage.value = t('movieAdmin.messages.saved')
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.errors.saveMovie')
  } finally {
    movieSaving.value = false
  }
}

const deleteCurrentMovie = async () => {
  if (!createdMovieId.value) return
  const title = movieForm.value.title || createdMovieId.value
  if (!confirm(t('movieAdmin.confirmDeleteMovie', { title }))) return
  const deleteVideos = !!(movieVideoId.value || trailerVideoId.value) && confirm(t('movieAdmin.confirmDeleteLinkedVideos'))

  movieDeleting.value = true
  movieError.value = ''
  movieProgressMessage.value = ''
  try {
    await deleteMovie(createdMovieId.value, { deleteVideos })
    resetMovieWorkspace()
    await loadMoviesAdminData()
    await loadExistingMovieVideos()
    movieProgressMessage.value = `Deleted "${title}".`
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || 'Failed to delete movie'
  } finally {
    movieDeleting.value = false
  }
}

const handleMovieSubmit = async () => {
  if (createdMovieId.value) {
    await saveMovieDetails()
  } else {
    await handleCreateMovie()
  }
}

const onTrailerFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  trailerFile.value = input.files?.[0] || null
}

const uploadTrailer = async () => {
  if (!createdMovieId.value || !trailerFile.value) return
  trailerUploading.value = true
  trailerProgress.value = 0
  movieError.value = ''
  try {
    const uploaded = await uploadVideo({
      title: trailerForm.value.title || `${movieForm.value.title} ${t('movieAdmin.defaults.trailerSuffix')}`,
      description: t('movieAdmin.messages.trailerDescription', { title: movieForm.value.title }),
      channelId: moviesChannelId,
      videoFile: trailerFile.value,
      explicit: false,
      hidden: false,
      categoryId: getMoviesCategoryId(),
      onProgress: (progress) => {
        trailerProgress.value = progress
      },
    })
    trailerVideoId.value = uploaded.video_id
    await setMovieTrailer(createdMovieId.value, uploaded.video_id)
    await loadMoviesAdminData()
    await loadExistingMovieVideos()
    movieProgressMessage.value = t('movieAdmin.messages.trailerUploaded')
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.errors.uploadTrailer')
  } finally {
    trailerUploading.value = false
  }
}

const onMovieFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  movieFile.value = input.files?.[0] || null
}

const uploadMovieVideo = async (useLocalUpload = false) => {
  if (!movieFile.value) return
  movieUploading.value = true
  movieUploadProgress.value = 0
  movieError.value = ''
  try {
    const uploaded = await uploadVideo({
      title: movieVideoTitle.value || movieForm.value.title,
      description: movieForm.value.synopsis,
      channelId: moviesChannelId,
      videoFile: movieFile.value,
      explicit: false,
      hidden: true,
      uploadBaseURL: useLocalUpload ? localUploadBaseURL : undefined,
      onProgress: (progress) => {
        movieUploadProgress.value = progress
      },
    })
    movieVideoId.value = uploaded.video_id
    movieVideoTitle.value = uploaded.title || movieVideoTitle.value || movieForm.value.title
    await loadExistingMovieVideos()
    movieProgressMessage.value = t(useLocalUpload ? 'movieAdmin.messages.movieUploadedLocal' : 'movieAdmin.messages.movieUploaded')
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.errors.uploadMovieVideo')
  } finally {
    movieUploading.value = false
  }
}

const attachMovieVideo = async () => {
  if (!createdMovieId.value || !movieVideoId.value) return
  movieAttaching.value = true
  movieError.value = ''
  try {
    await setMovieVideo(createdMovieId.value, movieVideoId.value)
    await updateMovie(createdMovieId.value, {
      title: movieForm.value.title,
      slug: movieForm.value.slug,
      synopsis: movieForm.value.synopsis,
      genre: movieForm.value.genre,
      genres: movieForm.value.genres,
      directors: movieForm.value.directors,
      cast: movieForm.value.cast,
      releaseYear: movieForm.value.releaseYear,
      channelId: moviesChannelId,
      isFeatured: movieForm.value.isFeatured,
      posterUrl: movieForm.value.posterUrl,
      backdropUrl: movieForm.value.backdropUrl,
      videoId: movieVideoId.value,
    })
    await loadMoviesAdminData()
    await loadExistingMovieVideos()
    await hydrateMovieWorkspace(createdMovieId.value)
    await loadMovieSubtitles()
    await loadMovieAudioTracks()
    movieProgressMessage.value = t('movieAdmin.messages.movieLinked')
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.errors.attachMovie')
  } finally {
    movieAttaching.value = false
  }
}

const linkExistingTrailer = async (video: any) => {
  if (!createdMovieId.value || !video?.id) return
  trailerAttaching.value = true
  movieError.value = ''
  try {
    await setMovieTrailer(createdMovieId.value, video.id)
    trailerVideoId.value = video.id
    if (!trailerForm.value.title) {
      trailerForm.value.title = video.title || `${movieForm.value.title} ${t('movieAdmin.defaults.trailerSuffix')}`
    }
    await loadMoviesAdminData()
    await hydrateMovieWorkspace(createdMovieId.value)
    movieProgressMessage.value = t('movieAdmin.messages.linkedExistingTrailer', { title: video.title })
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.errors.linkTrailer')
  } finally {
    trailerAttaching.value = false
  }
}

const linkExistingMovie = async (video: any) => {
  if (!video?.id) return
  movieVideoId.value = video.id
  movieVideoTitle.value = video.title || movieForm.value.title
  await attachMovieVideo()
}

const loadMovieSubtitles = async () => {
  if (!createdMovieId.value || !movieVideoId.value) {
    movieSubtitles.value = []
    return
  }
  try {
    const data = await listMovieSubtitles(createdMovieId.value)
    movieSubtitles.value = data.subtitles || []
  } catch (err: any) {
    movieSubtitles.value = []
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.subtitles.errors.load')
  }
}

const loadMovieAudioTracks = async () => {
  if (!createdMovieId.value || !movieVideoId.value) {
    movieAudioTracks.value = []
    return
  }
  try {
    const data = await listMovieAudioTracks(createdMovieId.value)
    movieAudioTracks.value = data.audio_tracks || []
  } catch (err: any) {
    movieAudioTracks.value = []
    movieError.value = err?.response?.data?.error || err?.message || 'Failed to load audio tracks'
  }
}

const onSubtitleFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  subtitleForm.value.file = input.files?.[0] || null
}

const onAudioFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  audioForm.value.file = input.files?.[0] || null
  audioUploadProgress.value = 0
  if (audioForm.value.file && !audioForm.value.label) {
    audioForm.value.label = audioForm.value.file.name.replace(/\.[^.]+$/, '')
  }
}

const resetSubtitleForm = () => {
  subtitleForm.value = {
    file: null,
    trackId: '',
    label: '',
    language: 'en',
    isDefault: false,
    delayMs: 0,
  }
}

const resetAudioForm = () => {
  audioUploadProgress.value = 0
  audioForm.value = {
    file: null,
    trackId: '',
    label: '',
    language: 'en',
    isDefault: false,
    delayMs: 0,
  }
}

const formatFileSize = (size: number) => {
  if (!Number.isFinite(size) || size <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = size
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`
}

const saveSubtitle = async () => {
  if (!createdMovieId.value) return
  subtitleSaving.value = true
  movieError.value = ''
  try {
    const data = await uploadMovieSubtitle(createdMovieId.value, {
      file: subtitleForm.value.file,
      label: subtitleForm.value.label,
      language: subtitleForm.value.language,
      isDefault: subtitleForm.value.isDefault,
      delayMs: subtitleForm.value.delayMs,
      trackId: subtitleForm.value.trackId || undefined,
    })
    movieSubtitles.value = data.subtitles || []
    resetSubtitleForm()
    movieProgressMessage.value = t('movieAdmin.subtitles.messages.saved')
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.subtitles.errors.save')
  } finally {
    subtitleSaving.value = false
  }
}

const saveSubtitleMetadata = async (track: SubtitleTrack) => {
  if (!createdMovieId.value) return
  subtitleSaving.value = true
  movieError.value = ''
  try {
    const data = await uploadMovieSubtitle(createdMovieId.value, {
      label: track.label,
      language: track.language,
      isDefault: track.default,
      delayMs: Number(track.delay_ms || 0),
      trackId: track.id,
    })
    movieSubtitles.value = data.subtitles || []
    movieProgressMessage.value = 'Subtitle title updated.'
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.subtitles.errors.save')
  } finally {
    subtitleSaving.value = false
  }
}

const startReplaceSubtitle = (track: SubtitleTrack) => {
  subtitleForm.value = {
    file: null,
    trackId: track.id,
    label: track.label || '',
    language: track.language || 'en',
    isDefault: !!track.default,
    delayMs: track.delay_ms || 0,
  }
}

const cancelReplaceSubtitle = () => {
  resetSubtitleForm()
}

const saveSubtitleDelay = async (track: SubtitleTrack) => {
  if (!createdMovieId.value) return
  subtitleSaving.value = true
  movieError.value = ''
  try {
    const data = await uploadMovieSubtitle(createdMovieId.value, {
      label: track.label,
      language: track.language,
      isDefault: track.default,
      delayMs: Number(track.delay_ms || 0),
      trackId: track.id,
    })
    movieSubtitles.value = data.subtitles || []
    movieProgressMessage.value = t('movieAdmin.subtitles.messages.delaySaved')
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.subtitles.errors.saveDelay')
  } finally {
    subtitleSaving.value = false
  }
}

const applyGlobalSubtitleDelay = async () => {
  if (!createdMovieId.value || !movieSubtitles.value.length) return

  globalSubtitleDelaySaving.value = true
  subtitleSaving.value = true
  movieError.value = ''
  const delayMs = Number(globalSubtitleDelayMs.value || 0)
  const tracks = movieSubtitles.value.map(track => ({ ...track, delay_ms: delayMs }))

  try {
    for (const track of tracks) {
      const data = await uploadMovieSubtitle(createdMovieId.value, {
        label: track.label,
        language: track.language,
        isDefault: track.default,
        delayMs,
        trackId: track.id,
      })
      movieSubtitles.value = data.subtitles || []
    }
    movieProgressMessage.value = t('movieAdmin.subtitles.messages.globalDelaySaved', { count: tracks.length })
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.subtitles.errors.globalDelay')
  } finally {
    subtitleSaving.value = false
    globalSubtitleDelaySaving.value = false
  }
}

const makeSubtitleDefault = async (track: SubtitleTrack) => {
  if (!createdMovieId.value) return
  subtitleSaving.value = true
  movieError.value = ''
  try {
    const data = await uploadMovieSubtitle(createdMovieId.value, {
      label: track.label,
      language: track.language,
      isDefault: true,
      delayMs: Number(track.delay_ms || 0),
      trackId: track.id,
    })
    movieSubtitles.value = data.subtitles || []
    movieProgressMessage.value = t('movieAdmin.subtitles.messages.defaultSaved')
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.subtitles.errors.default')
  } finally {
    subtitleSaving.value = false
  }
}

const fixSubtitleDefaults = async () => {
  const preferred = movieSubtitles.value.find(track => track.default) || movieSubtitles.value[0]
  if (preferred) await makeSubtitleDefault(preferred)
}

const removeSubtitle = async (track: SubtitleTrack) => {
  if (!createdMovieId.value || !confirm(t('movieAdmin.subtitles.confirmDelete', { label: track.label || track.language || track.id }))) return
  subtitleSaving.value = true
  movieError.value = ''
  try {
    const data = await deleteMovieSubtitle(createdMovieId.value, track.id)
    movieSubtitles.value = data.subtitles || []
    movieProgressMessage.value = t('movieAdmin.subtitles.messages.deleted')
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.subtitles.errors.delete')
  } finally {
    subtitleSaving.value = false
  }
}

const saveAudioTrack = async (useLocalUpload = false) => {
  if (!createdMovieId.value) return
  if (!audioForm.value.file && !audioForm.value.trackId) {
    movieError.value = 'Choose an audio file first.'
    return
  }
  audioSaving.value = true
  audioUploadProgress.value = 0
  movieError.value = ''
  try {
    const data = await uploadMovieAudioTrack(createdMovieId.value, {
      file: audioForm.value.file,
      label: audioForm.value.label,
      language: audioForm.value.language,
      isDefault: audioForm.value.isDefault,
      delayMs: audioForm.value.delayMs,
      trackId: audioForm.value.trackId || undefined,
      uploadBaseURL: useLocalUpload ? localUploadBaseURL : undefined,
      onUploadProgress: progress => {
        audioUploadProgress.value = progress
      },
    })
    movieAudioTracks.value = data.audio_tracks || []
    resetAudioForm()
    movieProgressMessage.value = 'Audio track saved.'
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || 'Failed to save audio track'
  } finally {
    audioSaving.value = false
  }
}

const saveAudioMetadata = async (track: AudioTrack) => {
  if (!createdMovieId.value) return
  audioSaving.value = true
  movieError.value = ''
  try {
    const data = await uploadMovieAudioTrack(createdMovieId.value, {
      label: track.label,
      language: track.language,
      isDefault: track.default,
      trackId: track.id,
    })
    movieAudioTracks.value = data.audio_tracks || []
    movieProgressMessage.value = 'Audio title updated.'
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || 'Failed to update audio track'
  } finally {
    audioSaving.value = false
  }
}

const makeAudioDefault = async (track: AudioTrack) => {
  track.default = true
  await saveAudioMetadata(track)
}

const startReplaceAudio = (track: AudioTrack) => {
  audioForm.value = {
    file: null,
    trackId: track.id,
    label: track.label || '',
    language: track.language || 'en',
    isDefault: !!track.default,
    delayMs: track.delay_ms || 0,
  }
}

const cancelReplaceAudio = () => {
  resetAudioForm()
}

const removeAudioTrack = async (track: AudioTrack) => {
  if (!createdMovieId.value || !confirm(`Delete audio track "${track.label || track.language || track.id}"?`)) return
  audioSaving.value = true
  movieError.value = ''
  try {
    const data = await deleteMovieAudioTrack(createdMovieId.value, track.id)
    movieAudioTracks.value = data.audio_tracks || []
    movieProgressMessage.value = 'Audio track deleted.'
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || 'Failed to delete audio track'
  } finally {
    audioSaving.value = false
  }
}

const audioDownloadName = (track: AudioTrack) => {
  const label = (track.label || track.language || track.id || 'audio')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${movieForm.value.slug || createdMovieId.value}-${label || 'audio'}.wav`
}

const downloadAudioTrack = async (track: AudioTrack) => {
  if (!createdMovieId.value) return
  audioDownloadingId.value = track.id
  movieError.value = ''
  try {
    await downloadMovieAudioTrackWAV(createdMovieId.value, track.id, audioDownloadName(track))
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('videoEditor.errors.downloadAudio')
  } finally {
    audioDownloadingId.value = ''
  }
}

const subtitleDownloadUrl = (track: SubtitleTrack) => {
  if (!movieVideoId.value || !track.uri) return '#'
  const subtitlePath = track.uri.replace(/playlist\.m3u8(?:\?.*)?$/i, 'captions.vtt')
  return `${import.meta.env.VITE_API_BASE_URL || ''}/videos/${movieVideoId.value}/${subtitlePath.startsWith('/') ? subtitlePath.slice(1) : subtitlePath}`
}

const subtitleDownloadName = (track: SubtitleTrack) => {
  const label = (track.label || track.language || track.id || 'subtitle')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${movieForm.value.slug || createdMovieId.value}-${label || 'subtitle'}.vtt`
}

onMounted(async () => {
  await loadMoviesAdminData()
  await loadExistingMovieVideos()
})
</script>
