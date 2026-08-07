<template>
  <div class="space-y-6">
    <section class="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-xl">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="text-2xl font-black text-white">{{ t('admin.mediaIngests.title') }}</h2>
          <p class="mt-1 max-w-3xl text-sm text-zinc-400">{{ t('admin.mediaIngests.subtitle') }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-500" @click="openUploadPanel">
            {{ t('admin.mediaIngests.upload.action') }}
          </button>
          <button type="button" class="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-zinc-700" @click="loadIngests">
            {{ t('common.refresh') }}
          </button>
        </div>
      </div>

      <form class="mt-5 grid gap-3 lg:grid-cols-[8rem_minmax(0,1.2fr)_6rem_7rem_minmax(0,2fr)_8rem]" @submit.prevent="submitIngest">
        <select v-model="form.media_type" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-red-400">
          <option value="movie">{{ t('admin.mediaIngests.movie') }}</option>
          <option value="series">{{ t('admin.mediaIngests.series') }}</option>
        </select>
        <input v-model="form.title" required :placeholder="t('admin.mediaIngests.titlePlaceholder')" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none placeholder:text-zinc-600 focus:border-red-400" />
        <input v-model.number="form.year" min="0" type="number" :placeholder="t('admin.mediaIngests.year')" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none placeholder:text-zinc-600 focus:border-red-400" />
        <input v-if="form.media_type === 'series'" v-model.number="form.season_count" min="1" type="number" :placeholder="t('admin.mediaIngests.seasonCount')" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none placeholder:text-zinc-600 focus:border-red-400" />
        <div v-else />
        <input v-model="form.source_url" required :placeholder="t('admin.mediaIngests.sourcePlaceholder')" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-400" />
        <button type="submit" :disabled="creating" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60">
          {{ creating ? t('admin.mediaIngests.queueing') : t('admin.mediaIngests.queue') }}
        </button>
      </form>

      <div v-if="message" class="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-sm text-emerald-100">{{ message }}</div>
      <div v-if="error" class="mt-4 rounded-lg border border-red-500/30 bg-red-950/50 p-3 text-sm text-red-100">{{ error }}</div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-xl">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[72rem] text-sm">
          <thead class="bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th class="px-4 py-3 text-left font-bold">{{ t('admin.mediaIngests.columns.item') }}</th>
              <th class="px-4 py-3 text-left font-bold">{{ t('admin.mediaIngests.columns.status') }}</th>
              <th class="px-4 py-3 text-left font-bold">{{ t('admin.mediaIngests.columns.progress') }}</th>
              <th class="px-4 py-3 text-left font-bold">{{ t('admin.mediaIngests.columns.path') }}</th>
              <th class="px-4 py-3 text-left font-bold">{{ t('admin.mediaIngests.columns.attach') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800">
            <tr v-for="item in ingests" :key="item.id" class="align-top transition hover:bg-zinc-900/70">
              <td class="px-4 py-4">
                <p class="font-bold text-white">{{ item.title }}</p>
                <p class="mt-1 text-xs text-zinc-500">{{ item.media_type }} <span v-if="item.year">· {{ item.year }}</span></p>
                <p class="mt-2 max-w-xs truncate font-mono text-xs text-zinc-600" :title="item.source_url">{{ item.source_url }}</p>
              </td>
              <td class="px-4 py-4">
                <span :class="statusClass(item.status)" class="rounded-full px-2.5 py-1 text-xs font-bold">
                  {{ statusLabel(item.status) }}
                </span>
                <p v-if="item.video_status" class="mt-2 text-xs text-zinc-500">{{ t('admin.mediaIngests.videoStatus', { status: item.video_status, progress: item.video_progress || 0 }) }}</p>
                <p v-if="item.error_message" class="mt-2 max-w-xs text-xs text-red-300">{{ item.error_message }}</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button
                    v-if="canRetry(item)"
                    type="button"
                    :disabled="actionBusyId === item.id"
                    class="rounded bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="retry(item)"
                  >
                    {{ t('admin.mediaIngests.retry') }}
                  </button>
                  <button
                    v-if="canPause(item)"
                    type="button"
                    :disabled="actionBusyId === item.id"
                    class="rounded bg-zinc-800 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="pause(item)"
                  >
                    {{ t('admin.mediaIngests.pause') }}
                  </button>
                  <button
                    v-if="canDeleteFiles(item)"
                    type="button"
                    :disabled="actionBusyId === item.id"
                    class="rounded border border-amber-500/50 px-3 py-1.5 text-xs font-bold text-amber-100 transition hover:bg-amber-950/60 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="removeFiles(item)"
                  >
                    {{ t('admin.mediaIngests.deleteFiles') }}
                  </button>
                  <button
                    v-if="canDelete(item)"
                    type="button"
                    :disabled="actionBusyId === item.id"
                    class="rounded border border-red-500/50 px-3 py-1.5 text-xs font-bold text-red-100 transition hover:bg-red-950/60 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="remove(item)"
                  >
                    {{ t('admin.mediaIngests.delete') }}
                  </button>
                </div>
              </td>
              <td class="px-4 py-4">
                <div class="h-2 w-36 overflow-hidden rounded-full bg-zinc-800">
                  <div class="h-full rounded-full bg-red-500" :style="{ width: `${displayProgress(item)}%` }" />
                </div>
                <p class="mt-2 text-xs text-zinc-500">
                  {{ displayProgress(item) }}%
                  <span v-if="item.download_speed">· {{ formatSpeed(item.download_speed) }}</span>
                  <span v-if="item.eta > 0">· {{ formatEta(item.eta) }}</span>
                </p>
              </td>
              <td class="px-4 py-4">
                <code class="block max-w-sm break-all rounded bg-black/40 p-2 text-xs text-zinc-300">{{ item.content_path || item.save_path || '-' }}</code>
              </td>
              <td class="px-4 py-4">
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    :disabled="!canOpenAttachPanel(item)"
                    class="rounded bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="openAttachPanel(item)"
                  >
                    {{ item.attached_video_id ? t('admin.mediaIngests.attachAgain') : t('admin.mediaIngests.attach') }}
                  </button>
                  <button
                    type="button"
                    :disabled="!canUseAsAudioSource(item)"
                    class="rounded bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="openAudioPanel(item)"
                  >
                    {{ t('admin.mediaIngests.audio.action') }}
                  </button>
                  <button
                    type="button"
                    :disabled="!canUseAsAudioSource(item)"
                    class="rounded bg-cyan-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="openSubtitlePanel(item)"
                  >
                    {{ t('admin.mediaIngests.subtitles.action') }}
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!ingests.length">
              <td colspan="5" class="px-4 py-10 text-center text-zinc-500">{{ t('admin.mediaIngests.empty') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="uploadPanelOpen"
        class="fixed inset-0 z-[9999] flex items-stretch justify-center overflow-hidden bg-black/85 text-white sm:items-center sm:p-6"
        :style="{ zIndex: 2147483647 }"
        @click.self="closeUploadPanel"
      >
        <section class="flex h-full w-full max-w-4xl flex-col overflow-hidden bg-zinc-950 shadow-2xl sm:max-h-[88dvh] sm:rounded-2xl sm:border sm:border-zinc-700">
          <header class="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-800 p-5 sm:p-6">
            <div>
              <p class="text-xs font-bold uppercase tracking-wide text-red-400">{{ t('admin.mediaIngests.upload.kicker') }}</p>
              <h3 class="mt-1 text-2xl font-black">{{ t('admin.mediaIngests.upload.title') }}</h3>
            </div>
            <button type="button" :disabled="uploadBusy" class="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-bold transition hover:bg-zinc-700 disabled:opacity-50" @click="closeUploadPanel">
              {{ t('common.close') }}
            </button>
          </header>

          <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-[9rem_minmax(0,1fr)_8rem_8rem]">
              <label class="grid gap-1 text-xs font-bold uppercase text-zinc-500">
                {{ t('admin.mediaIngests.upload.mediaType') }}
                <select v-model="uploadForm.mediaType" :disabled="uploadBusy" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-normal normal-case text-white focus:border-red-400">
                  <option value="movie">{{ t('admin.mediaIngests.movie') }}</option>
                  <option value="series">{{ t('admin.mediaIngests.series') }}</option>
                </select>
              </label>
              <label class="grid gap-1 text-xs font-bold uppercase text-zinc-500">
                {{ t('admin.mediaIngests.upload.titleLabel') }}
                <input v-model="uploadForm.title" :disabled="uploadBusy" class="min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-normal normal-case text-white focus:border-red-400" />
              </label>
              <label class="grid gap-1 text-xs font-bold uppercase text-zinc-500">
                {{ t('admin.mediaIngests.year') }}
                <input v-model.number="uploadForm.year" :disabled="uploadBusy" min="0" type="number" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-normal normal-case text-white focus:border-red-400" />
              </label>
              <label v-if="uploadForm.mediaType === 'series'" class="grid gap-1 text-xs font-bold uppercase text-zinc-500">
                {{ t('admin.mediaIngests.seasonCount') }}
                <input v-model.number="uploadForm.seasonCount" :disabled="uploadBusy" min="1" type="number" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-normal normal-case text-white focus:border-red-400" />
              </label>
            </div>

            <div
              class="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-600 bg-zinc-900/60 p-6 text-center transition hover:border-red-400"
              @dragover.prevent
              @drop.prevent="onUploadDrop"
            >
              <p class="text-lg font-black">{{ t('admin.mediaIngests.upload.dropTitle') }}</p>
              <p class="mt-1 text-sm text-zinc-400">{{ t('admin.mediaIngests.upload.dropBody') }}</p>
              <button type="button" :disabled="uploadBusy" class="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-bold hover:bg-zinc-700 disabled:opacity-50" @click="uploadFileInput?.click()">
                {{ t('admin.mediaIngests.upload.choose') }}
              </button>
              <input ref="uploadFileInput" multiple type="file" class="hidden" :accept="uploadAccept" @change="onUploadFilesSelected" />
            </div>

            <div v-if="uploadFiles.length" class="space-y-2">
              <div v-for="(row, index) in uploadFiles" :key="row.key" class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-bold" :title="row.file.name">{{ row.file.name }}</p>
                    <p class="mt-1 text-xs text-zinc-500">{{ formatBytes(row.file.size) }}<span v-if="row.status"> · {{ row.status }}</span></p>
                  </div>
                  <button v-if="!uploadBusy" type="button" class="shrink-0 text-xs font-bold text-zinc-400 hover:text-red-300" @click="removeUploadFile(index)">
                    {{ t('admin.mediaIngests.upload.remove') }}
                  </button>
                </div>
                <div v-if="uploadBusy || row.progress" class="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div class="h-full rounded-full bg-red-500 transition-[width]" :style="{ width: `${row.progress}%` }" />
                </div>
              </div>
            </div>

            <p v-if="uploadError" class="rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{{ uploadError }}</p>
          </div>

          <footer class="flex shrink-0 items-center justify-between gap-4 border-t border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <p class="text-sm text-zinc-500">{{ t('admin.mediaIngests.upload.selected', { count: uploadFiles.length }) }}</p>
            <button type="button" :disabled="!uploadFiles.length || uploadBusy" class="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50" @click="submitUploadedIngest">
              {{ uploadBusy ? t('admin.mediaIngests.upload.uploading') : t('admin.mediaIngests.upload.submit') }}
            </button>
          </footer>
        </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="attachPanelItem"
        class="fixed inset-0 z-[9999] flex items-stretch justify-center overflow-hidden bg-black/80 px-3 py-3 text-white sm:items-center sm:px-6 sm:py-8"
        :style="{ zIndex: 2147483647 }"
        @click.self="closeAttachPanel"
      >
        <section class="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl sm:h-auto sm:max-h-[88dvh]" style="max-width: min(100%, 72rem);">
          <header class="flex shrink-0 flex-col gap-3 border-b border-zinc-800 bg-zinc-900/80 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-wide text-zinc-500">{{ t('admin.mediaIngests.columns.attach') }}</p>
              <h3 class="mt-1 truncate text-2xl font-black text-white">{{ attachPanelItem.title }}</h3>
              <p class="mt-1 text-sm text-zinc-500">
                {{ attachPanelItem.media_type }} <span v-if="attachPanelItem.year">· {{ attachPanelItem.year }}</span> · {{ attachPanelItem.status }}
              </p>
            </div>
            <button type="button" class="self-start rounded-lg bg-zinc-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-zinc-700" @click="closeAttachPanel">
              {{ t('common.close') }}
            </button>
          </header>

          <div class="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div class="space-y-4">
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="grid gap-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
                  {{ t('admin.mediaIngests.selectChannel') }}
                  <select v-model="attachForms[attachPanelItem.id].channel_id" class="w-full min-w-0 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-normal normal-case tracking-normal text-white">
                    <option value="">{{ t('admin.mediaIngests.selectChannel') }}</option>
                    <option v-for="channel in channels" :key="channel.id" :value="channel.id">{{ channel.name }}</option>
                  </select>
                </label>
                <label class="grid gap-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
                  {{ t('admin.mediaIngests.titlePlaceholder') }}
                  <input v-model="attachForms[attachPanelItem.id].title" :placeholder="attachPanelItem.title" class="w-full min-w-0 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-normal normal-case tracking-normal text-white placeholder:text-zinc-600" />
                </label>
              </div>

            <label class="grid gap-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
              {{ t('admin.mediaIngests.description') }}
              <textarea v-model="attachForms[attachPanelItem.id].description" rows="4" :placeholder="t('admin.mediaIngests.description')" class="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-normal normal-case tracking-normal text-white placeholder:text-zinc-600" />
            </label>

            <div v-if="attachPanelItem.media_type === 'series'" class="space-y-4 rounded-xl border border-zinc-800 bg-black/30 p-4">
              <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                <select v-model="attachForms[attachPanelItem.id].series_id" class="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" @change="normalizeSeriesPreview(attachPanelItem.id)">
                  <option value="">{{ t('admin.mediaIngests.createNewSeries') }}</option>
                  <option v-for="series in props.seriesItems || []" :key="series.id" :value="series.id">
                    {{ series.title }} · {{ t('admin.mediaIngests.existingSeriesMeta', { seasons: series.seasons || 1, episodes: series.episode_count || 0 }) }}
                  </option>
                </select>
                <button type="button" :disabled="!canPreviewSeries(attachPanelItem) || previewState(attachPanelItem.id).loading" class="rounded bg-zinc-800 px-3 py-2 text-xs font-bold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50" @click="loadSeriesPreview(attachPanelItem)">
                  {{ previewState(attachPanelItem.id).loading ? t('admin.mediaIngests.previewing') : t('admin.mediaIngests.preview') }}
                </button>
              </div>
              <p class="text-xs text-zinc-500">{{ selectedSeries(attachPanelItem) ? t('admin.mediaIngests.appendSeriesHelp') : t('admin.mediaIngests.newSeriesHelp', { seasons: attachPanelItem.season_count || 1 }) }}</p>
              <p v-if="previewState(attachPanelItem.id).error" class="text-xs text-red-300">{{ previewState(attachPanelItem.id).error }}</p>

              <div v-if="previewState(attachPanelItem.id).files.length" class="space-y-3">
                <div class="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                  <span>{{ t('admin.mediaIngests.previewFiles', { count: previewState(attachPanelItem.id).files.length }) }}</span>
                  <span>{{ attachPanelItem.season_count || 1 }} {{ t('admin.mediaIngests.seasonsShort') }}</span>
                </div>
                <div class="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                  <div v-for="file in previewState(attachPanelItem.id).files" :key="file.file_path" class="rounded border border-zinc-800 bg-zinc-950 p-3">
                    <div class="grid gap-2 sm:grid-cols-[4.5rem_3.5rem_minmax(0,1fr)]">
                      <select v-model.number="file.season_number" class="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white" @change="normalizeSeriesPreview(attachPanelItem.id)">
                        <option v-for="season in seasonOptions(attachPanelItem)" :key="season" :value="season">S{{ season }}</option>
                      </select>
                      <span class="rounded border border-zinc-800 bg-black/40 px-2 py-1 text-center text-xs font-bold text-zinc-300">E{{ file.episode_number }}</span>
                      <input v-model="file.title" :placeholder="t('admin.mediaIngests.episodeTitle')" class="min-w-0 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white placeholder:text-zinc-600" />
                    </div>
                    <div class="mt-2 flex flex-wrap items-center gap-2">
                      <button type="button" class="rounded border border-zinc-700 px-2 py-1 text-[11px] font-bold text-zinc-200 transition hover:bg-zinc-800" @click="moveSeriesPreviewEpisode(attachPanelItem.id, file, -1)">{{ t('admin.mediaIngests.moveUp') }}</button>
                      <button type="button" class="rounded border border-zinc-700 px-2 py-1 text-[11px] font-bold text-zinc-200 transition hover:bg-zinc-800" @click="moveSeriesPreviewEpisode(attachPanelItem.id, file, 1)">{{ t('admin.mediaIngests.moveDown') }}</button>
                      <span class="text-[11px] text-zinc-500">{{ formatBytes(file.size) }}</span>
                    </div>
                    <code class="mt-2 block break-all text-[11px] text-zinc-500">{{ file.relative_path || file.file_name }}</code>
                  </div>
                </div>
              </div>
            </div>

            <template v-else>
              <label class="grid gap-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
                {{ t('admin.mediaIngests.filePathOverride') }}
                <input v-model="attachForms[attachPanelItem.id].file_path" :placeholder="t('admin.mediaIngests.filePathOverride')" class="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs font-normal normal-case tracking-normal text-white placeholder:text-zinc-600" />
              </label>
            </template>
          </div>

          <aside class="space-y-4 rounded-xl border border-zinc-800 bg-black/30 p-4">
            <div v-if="attachPanelItem.attached_video_id" class="rounded border border-amber-500/40 bg-amber-950/30 p-3 text-xs leading-5 text-amber-100">
              {{ t('admin.mediaIngests.alreadyAttachedWarning') }}
            </div>
            <div>
              <p class="text-xs font-bold uppercase tracking-wide text-zinc-500">{{ t('admin.mediaIngests.columns.path') }}</p>
              <code class="mt-2 block break-all rounded bg-black/40 p-2 text-xs text-zinc-300">{{ attachPanelItem.content_path || attachPanelItem.save_path || '-' }}</code>
            </div>
            <div>
              <p class="text-xs font-bold uppercase tracking-wide text-zinc-500">{{ t('admin.mediaIngests.columns.progress') }}</p>
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div class="h-full rounded-full bg-red-500" :style="{ width: `${displayProgress(attachPanelItem)}%` }" />
              </div>
              <p class="mt-2 text-xs text-zinc-500">{{ displayProgress(attachPanelItem) }}%</p>
            </div>
            <label class="flex items-center gap-2 text-xs text-zinc-400">
              <input v-model="attachForms[attachPanelItem.id].hidden" type="checkbox" class="h-4 w-4 accent-red-500" />
              {{ t('admin.mediaIngests.hidden') }}
            </label>
            <button
              v-if="attachPanelItem.media_type === 'series'"
              type="button"
              :disabled="!canBulkAttachSeries(attachPanelItem) || previewState(attachPanelItem.id).attaching"
              class="w-full rounded bg-blue-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              @click="bulkAttachSeries(attachPanelItem)"
            >
              {{ previewState(attachPanelItem.id).attaching ? t('admin.mediaIngests.bulkAttaching') : attachPanelItem.attached_video_id ? t('admin.mediaIngests.bulkAttachAgain') : t('admin.mediaIngests.bulkAttach') }}
            </button>
            <button
              v-else
              type="button"
              :disabled="!canAttach(attachPanelItem) || attachingId === attachPanelItem.id"
              class="w-full rounded bg-blue-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              @click="attach(attachPanelItem)"
            >
              {{ attachingId === attachPanelItem.id ? t('admin.mediaIngests.attaching') : attachPanelItem.attached_video_id ? t('admin.mediaIngests.attachAgain') : t('admin.mediaIngests.attach') }}
            </button>
          </aside>
        </div>
        </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="audioPanelItem"
        class="fixed inset-0 flex overflow-hidden bg-black/90 text-white"
        :style="{ zIndex: 2147483647 }"
      >
        <section class="flex min-h-0 w-full flex-col bg-zinc-950">
          <header class="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4 sm:px-8">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase text-emerald-400">{{ t('admin.mediaIngests.audio.kicker') }}</p>
              <h2 class="mt-1 truncate text-2xl font-black">{{ t('admin.mediaIngests.audio.title') }}</h2>
              <p class="mt-1 truncate text-sm text-zinc-500">{{ audioPanelItem.title }}</p>
            </div>
            <button type="button" :disabled="bulkAudioImporting" class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-zinc-800 text-2xl text-white hover:bg-zinc-700 disabled:opacity-50" :aria-label="t('common.close')" @click="closeAudioPanel">×</button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
            <p v-if="audioPanelError && importedAudio" class="mx-auto mb-4 max-w-5xl rounded border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{{ audioPanelError }}</p>
            <div v-if="!importedAudio" class="mx-auto mb-5 flex w-full max-w-5xl items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
              <button type="button" :disabled="bulkAudioImporting" :class="audioMode === 'single' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'" class="flex-1 rounded-md px-4 py-2 text-sm font-bold transition disabled:opacity-50" @click="setAudioMode('single')">
                {{ t('admin.mediaIngests.audio.singleMode') }}
              </button>
              <button type="button" :disabled="bulkAudioImporting" :class="audioMode === 'bulk' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'" class="flex-1 rounded-md px-4 py-2 text-sm font-bold transition disabled:opacity-50" @click="setAudioMode('bulk')">
                {{ t('admin.mediaIngests.audio.bulkMode') }}
              </button>
            </div>
            <AudioSyncEditor
              v-if="importedAudio"
              :video-src="importedVideoSrc"
              :candidate-src="importedCandidateSrc"
              :target-title="importedAudio.targetTitle"
              :track-label="importedAudio.label"
              :initial-delay-ms="importedAudio.delayMs"
              :initial-trim-start-ms="importedAudio.trimStartMs"
              :saving="audioSyncSaving"
              @close="resetImportedAudio"
              @save="saveImportedAudioSync"
            />

            <div v-else-if="audioMode === 'single'" class="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div class="space-y-5">
                <section class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <h3 class="font-bold">{{ t('admin.mediaIngests.audio.destination') }}</h3>
                  <div class="mt-3 grid gap-3 sm:grid-cols-2">
                    <select v-model="audioForm.targetType" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-white" @change="resetAudioTarget">
                      <option value="movie">{{ t('admin.mediaIngests.audio.movie') }}</option>
                      <option value="episode">{{ t('admin.mediaIngests.audio.episode') }}</option>
                    </select>
                    <select v-if="audioForm.targetType === 'movie'" v-model="audioForm.targetId" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-white">
                      <option value="">{{ t('admin.mediaIngests.audio.selectMovie') }}</option>
                      <option v-for="movie in audioMovies" :key="movie.id" :value="movie.id" :disabled="!movie.video_id">{{ movie.title }}</option>
                    </select>
                    <select v-else v-model="audioForm.seriesId" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-white" @change="loadAudioEpisodes">
                      <option value="">{{ t('admin.mediaIngests.audio.selectSeries') }}</option>
                      <option v-for="series in props.seriesItems || []" :key="series.id" :value="series.id">{{ series.title }}</option>
                    </select>
                    <select v-if="audioForm.targetType === 'episode'" v-model="audioForm.targetId" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-white sm:col-span-2">
                      <option value="">{{ t('admin.mediaIngests.audio.selectEpisode') }}</option>
                      <option v-for="episode in audioEpisodes" :key="episode.id" :value="episode.id">S{{ episode.season_number }} E{{ episode.episode_number }} · {{ episode.title }}</option>
                    </select>
                  </div>
                </section>

                <section class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <h3 class="font-bold">{{ t('admin.mediaIngests.audio.source') }}</h3>
                  <div v-if="audioSourcesLoading" class="mt-3 text-sm text-zinc-400">{{ t('admin.mediaIngests.audio.inspecting') }}</div>
                  <div v-else class="mt-3 grid gap-3">
                    <select v-model="audioForm.filePath" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-white" @change="selectFirstAudioStream">
                      <option value="">{{ t('admin.mediaIngests.audio.selectFile') }}</option>
                      <option v-for="source in audioSources" :key="source.file_path" :value="source.file_path">{{ source.relative_path }} · {{ formatBytes(source.size) }}</option>
                    </select>
                    <select v-model.number="audioForm.streamIndex" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-white" @change="fillAudioStreamMetadata">
                      <option :value="-1">{{ t('admin.mediaIngests.audio.selectStream') }}</option>
                      <option v-for="stream in selectedAudioSource?.streams || []" :key="stream.index" :value="stream.index">{{ audioStreamLabel(stream) }}</option>
                    </select>
                  </div>
                </section>

                <section class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <h3 class="font-bold">{{ t('admin.mediaIngests.audio.details') }}</h3>
                  <div class="mt-3 grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
                    <input v-model="audioForm.language" placeholder="es" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-white placeholder:text-zinc-600" />
                    <input v-model="audioForm.label" placeholder="Español Latino" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-white placeholder:text-zinc-600" />
                  </div>
                  <label class="mt-3 flex items-center gap-2 text-sm text-zinc-300">
                    <input v-model="audioForm.isDefault" type="checkbox" class="h-4 w-4 accent-red-500" />
                    {{ t('admin.mediaIngests.audio.default') }}
                  </label>
                </section>
              </div>

              <aside class="h-fit rounded-lg border border-zinc-800 bg-black/30 p-4 lg:sticky lg:top-0">
                <p class="text-sm leading-6 text-zinc-400">{{ t('admin.mediaIngests.audio.preserveNote') }}</p>
                <p v-if="audioPanelError" class="mt-4 rounded border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{{ audioPanelError }}</p>
                <button type="button" :disabled="!canImportAudio || audioImporting" class="mt-5 w-full rounded-lg bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50" @click="importSelectedAudio">
                  {{ audioImporting ? t('admin.mediaIngests.audio.extracting') : t('admin.mediaIngests.audio.openEditor') }}
                </button>
              </aside>
            </div>

            <div v-else class="mx-auto w-full max-w-6xl space-y-5">
              <section class="grid gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 lg:grid-cols-[minmax(0,1fr)_9rem_9rem_9rem]">
                <label class="grid gap-1 text-xs font-bold uppercase text-zinc-500">
                  {{ t('admin.mediaIngests.audio.selectSeries') }}
                  <select v-model="bulkSeriesId" :disabled="bulkAudioImporting" class="min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-normal normal-case text-white" @change="loadBulkAudioEpisodes">
                    <option value="">{{ t('admin.mediaIngests.audio.selectSeries') }}</option>
                    <option v-for="series in props.seriesItems || []" :key="series.id" :value="series.id">{{ series.title }}</option>
                  </select>
                </label>
                <label class="grid gap-1 text-xs font-bold uppercase text-zinc-500">
                  {{ t('admin.mediaIngests.audio.language') }}
                  <input v-model="bulkAudioForm.language" :disabled="bulkAudioImporting" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-normal normal-case text-white" />
                </label>
                <label class="grid gap-1 text-xs font-bold uppercase text-zinc-500">
                  {{ t('admin.mediaIngests.audio.delay') }}
                  <input v-model.number="bulkAudioForm.delayMs" :disabled="bulkAudioImporting" type="number" step="1" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-normal normal-case text-white" />
                </label>
                <label class="grid gap-1 text-xs font-bold uppercase text-zinc-500">
                  {{ t('admin.mediaIngests.audio.trim') }}
                  <input v-model.number="bulkAudioForm.trimStartMs" :disabled="bulkAudioImporting" min="0" type="number" step="1" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-normal normal-case text-white" />
                </label>
                <label class="grid gap-1 text-xs font-bold uppercase text-zinc-500 lg:col-span-4">
                  {{ t('admin.mediaIngests.audio.label') }}
                  <input v-model="bulkAudioForm.label" :disabled="bulkAudioImporting" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-normal normal-case text-white" />
                </label>
              </section>

              <section class="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                <div class="flex flex-col gap-3 border-b border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 class="font-black">{{ t('admin.mediaIngests.audio.bulkLinks') }}</h3>
                    <p class="mt-1 text-sm text-zinc-500">{{ t('admin.mediaIngests.audio.bulkHelp') }}</p>
                  </div>
                  <div class="flex gap-2">
                    <button type="button" :disabled="bulkAudioImporting" class="rounded-md bg-zinc-800 px-3 py-2 text-xs font-bold hover:bg-zinc-700 disabled:opacity-50" @click="includeAllBulkMatches">{{ t('admin.mediaIngests.audio.includeMatched') }}</button>
                    <button type="button" :disabled="bulkAudioImporting" class="rounded-md bg-zinc-800 px-3 py-2 text-xs font-bold hover:bg-zinc-700 disabled:opacity-50" @click="excludeAllBulkRows">{{ t('admin.mediaIngests.audio.excludeAll') }}</button>
                  </div>
                </div>

                <div v-if="bulkEpisodesLoading" class="p-8 text-center text-sm text-zinc-400">{{ t('admin.mediaIngests.audio.loadingEpisodes') }}</div>
                <div v-else-if="!bulkSeriesId" class="p-8 text-center text-sm text-zinc-500">{{ t('admin.mediaIngests.audio.chooseSeriesHelp') }}</div>
                <div v-else class="divide-y divide-zinc-800">
                  <div v-for="row in bulkAudioRows" :key="row.targetId" :class="row.included ? 'bg-zinc-900/40' : 'opacity-60'" class="grid gap-3 p-4 transition md:grid-cols-[3rem_minmax(10rem,0.8fr)_minmax(14rem,1.3fr)_minmax(10rem,0.8fr)] md:items-center">
                    <label class="flex items-center gap-2 text-xs font-bold text-zinc-400">
                      <input v-model="row.included" :disabled="bulkAudioImporting || row.status === 'done' || !row.sourcePath" type="checkbox" class="h-5 w-5 accent-red-500" />
                      <span class="md:hidden">{{ t('admin.mediaIngests.audio.include') }}</span>
                    </label>
                    <div class="min-w-0">
                      <p class="truncate font-bold">S{{ row.seasonNumber }} E{{ row.episodeNumber }} · {{ row.targetTitle }}</p>
                      <p v-if="row.status" :class="row.status === 'error' ? 'text-red-300' : row.status === 'done' ? 'text-emerald-300' : 'text-zinc-500'" class="mt-1 truncate text-xs">{{ bulkRowStatus(row) }}</p>
                      <p v-else-if="row.matchKind" class="mt-1 text-xs text-emerald-400">{{ bulkMatchLabel(row.matchKind) }}</p>
                      <p v-else class="mt-1 text-xs text-amber-300">{{ t('admin.mediaIngests.audio.noMatch') }}</p>
                    </div>
                    <select v-model="row.sourcePath" :disabled="bulkAudioImporting || row.status === 'done'" class="min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" @change="selectBulkSource(row)">
                      <option value="">{{ t('admin.mediaIngests.audio.excludeEpisode') }}</option>
                      <option v-for="source in audioSources" :key="source.file_path" :value="source.file_path">{{ source.relative_path }}</option>
                    </select>
                    <select v-model.number="row.streamIndex" :disabled="bulkAudioImporting || row.status === 'done' || !row.sourcePath" class="min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white">
                      <option :value="-1">{{ t('admin.mediaIngests.audio.selectStream') }}</option>
                      <option v-for="stream in bulkRowSource(row)?.streams || []" :key="stream.index" :value="stream.index">{{ audioStreamLabel(stream) }}</option>
                    </select>
                    <p v-if="row.error" class="text-xs text-red-300 md:col-start-2 md:col-span-3">{{ row.error }}</p>
                  </div>
                  <div v-if="!bulkAudioRows.length" class="p-8 text-center text-sm text-zinc-500">{{ t('admin.mediaIngests.audio.noEpisodes') }}</div>
                </div>
              </section>

              <div class="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-sm text-zinc-400">{{ t('admin.mediaIngests.audio.bulkCount', { count: bulkReadyRows.length }) }}</p>
                <button type="button" :disabled="!bulkReadyRows.length || bulkAudioImporting" class="rounded-lg bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50" @click="importBulkAudio">
                  {{ bulkAudioImporting ? t('admin.mediaIngests.audio.bulkImporting', { current: bulkImportProgress.current, total: bulkImportProgress.total }) : t('admin.mediaIngests.audio.bulkSubmit') }}
                </button>
              </div>
              <p v-if="bulkAudioMessage" class="rounded border border-emerald-500/30 bg-emerald-950/40 p-3 text-sm text-emerald-200">{{ bulkAudioMessage }}</p>
              <p v-if="audioPanelError" class="rounded border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{{ audioPanelError }}</p>
            </div>
          </div>
        </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="subtitlePanelItem" class="fixed inset-0 flex overflow-hidden bg-black/90 text-white" :style="{ zIndex: 2147483647 }">
        <section class="flex min-h-0 w-full flex-col bg-zinc-950">
          <header class="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4 sm:px-8">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase text-cyan-400">{{ t('admin.mediaIngests.subtitles.kicker') }}</p>
              <h2 class="mt-1 truncate text-2xl font-black">{{ t('admin.mediaIngests.subtitles.title') }}</h2>
              <p class="mt-1 truncate text-sm text-zinc-500">{{ subtitlePanelItem.title }}</p>
            </div>
            <button type="button" :disabled="subtitleImporting" class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-zinc-800 text-2xl hover:bg-zinc-700 disabled:opacity-50" :aria-label="t('common.close')" @click="closeSubtitlePanel">×</button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
            <div class="mx-auto mb-5 flex w-full max-w-5xl gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
              <button type="button" :disabled="subtitleImporting" :class="subtitleMode === 'single' ? 'bg-zinc-700 text-white' : 'text-zinc-400'" class="flex-1 rounded-md px-4 py-2 text-sm font-bold" @click="subtitleMode = 'single'">{{ t('admin.mediaIngests.subtitles.singleMode') }}</button>
              <button type="button" :disabled="subtitleImporting" :class="subtitleMode === 'bulk' ? 'bg-zinc-700 text-white' : 'text-zinc-400'" class="flex-1 rounded-md px-4 py-2 text-sm font-bold" @click="subtitleMode = 'bulk'">{{ t('admin.mediaIngests.subtitles.bulkMode') }}</button>
            </div>

            <div v-if="subtitleSourcesLoading" class="mx-auto max-w-5xl py-16 text-center text-zinc-400">{{ t('admin.mediaIngests.subtitles.inspecting') }}</div>
            <div v-else-if="subtitleMode === 'single'" class="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div class="space-y-5">
                <section class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <h3 class="font-bold">{{ t('admin.mediaIngests.subtitles.destination') }}</h3>
                  <div class="mt-3 grid gap-3 sm:grid-cols-2">
                    <select v-model="subtitleForm.targetType" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3" @change="resetSubtitleTarget">
                      <option value="movie">{{ t('admin.mediaIngests.audio.movie') }}</option>
                      <option value="episode">{{ t('admin.mediaIngests.audio.episode') }}</option>
                    </select>
                    <select v-if="subtitleForm.targetType === 'movie'" v-model="subtitleForm.targetId" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3">
                      <option value="">{{ t('admin.mediaIngests.audio.selectMovie') }}</option>
                      <option v-for="movie in subtitleMovies" :key="movie.id" :value="movie.id" :disabled="!movie.video_id">{{ movie.title }}</option>
                    </select>
                    <select v-else v-model="subtitleForm.seriesId" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3" @change="loadSubtitleEpisodes">
                      <option value="">{{ t('admin.mediaIngests.audio.selectSeries') }}</option>
                      <option v-for="series in props.seriesItems || []" :key="series.id" :value="series.id">{{ series.title }}</option>
                    </select>
                    <select v-if="subtitleForm.targetType === 'episode'" v-model="subtitleForm.targetId" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 sm:col-span-2">
                      <option value="">{{ t('admin.mediaIngests.audio.selectEpisode') }}</option>
                      <option v-for="episode in subtitleEpisodes" :key="episode.id" :value="episode.id">S{{ episode.season_number }} E{{ episode.episode_number }} · {{ episode.title }}</option>
                    </select>
                  </div>
                </section>

                <section class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <h3 class="font-bold">{{ t('admin.mediaIngests.subtitles.source') }}</h3>
                  <div class="mt-3 grid gap-3">
                    <select v-model="subtitleForm.filePath" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3" @change="selectFirstSubtitleStream">
                      <option value="">{{ t('admin.mediaIngests.subtitles.selectFile') }}</option>
                      <option v-for="source in subtitleSources" :key="source.file_path" :value="source.file_path">{{ source.relative_path }}</option>
                    </select>
                    <select v-model.number="subtitleForm.streamIndex" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3" @change="fillSubtitleMetadata">
                      <option :value="-1">{{ t('admin.mediaIngests.subtitles.selectStream') }}</option>
                      <option v-for="stream in selectedSubtitleSource?.streams || []" :key="stream.index" :value="stream.index">{{ subtitleStreamLabel(stream) }}</option>
                    </select>
                  </div>
                </section>

                <section class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <h3 class="font-bold">{{ t('admin.mediaIngests.subtitles.details') }}</h3>
                  <div class="mt-3 grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)_9rem]">
                    <input v-model="subtitleForm.language" placeholder="es" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3" />
                    <input v-model="subtitleForm.label" placeholder="Español" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3" />
                    <input v-model.number="subtitleForm.delayMs" type="number" step="100" :placeholder="t('admin.mediaIngests.subtitles.delay')" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3" />
                  </div>
                  <label class="mt-3 flex items-center gap-2 text-sm text-zinc-300"><input v-model="subtitleForm.isDefault" type="checkbox" class="h-4 w-4 accent-red-500" />{{ t('admin.mediaIngests.subtitles.default') }}</label>
                </section>
              </div>
              <aside class="h-fit rounded-lg border border-zinc-800 bg-black/30 p-4 lg:sticky lg:top-0">
                <p class="text-sm leading-6 text-zinc-400">{{ t('admin.mediaIngests.subtitles.preserveNote') }}</p>
                <button type="button" :disabled="!canImportSubtitle || subtitleImporting" class="mt-5 w-full rounded-lg bg-cyan-700 px-4 py-3 font-bold hover:bg-cyan-600 disabled:opacity-50" @click="importSelectedSubtitle">{{ subtitleImporting ? t('admin.mediaIngests.subtitles.importing') : t('admin.mediaIngests.subtitles.import') }}</button>
              </aside>
            </div>

            <div v-else class="mx-auto w-full max-w-6xl space-y-5">
              <section class="grid gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 lg:grid-cols-[minmax(0,1fr)_8rem_minmax(10rem,0.7fr)_9rem]">
                <select v-model="subtitleBulkSeriesId" :disabled="subtitleImporting" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3" @change="loadSubtitleBulkEpisodes">
                  <option value="">{{ t('admin.mediaIngests.audio.selectSeries') }}</option>
                  <option v-for="series in props.seriesItems || []" :key="series.id" :value="series.id">{{ series.title }}</option>
                </select>
                <input v-model="subtitleBulkForm.language" :disabled="subtitleImporting" placeholder="es" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3" />
                <input v-model="subtitleBulkForm.label" :disabled="subtitleImporting" placeholder="Español" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3" />
                <input v-model.number="subtitleBulkForm.delayMs" :disabled="subtitleImporting" type="number" step="100" :placeholder="t('admin.mediaIngests.subtitles.delay')" class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3" />
              </section>

              <section class="overflow-hidden rounded-lg border border-zinc-800">
                <div class="border-b border-zinc-800 p-4"><h3 class="font-black">{{ t('admin.mediaIngests.subtitles.bulkLinks') }}</h3><p class="mt-1 text-sm text-zinc-500">{{ t('admin.mediaIngests.subtitles.bulkHelp') }}</p></div>
                <div v-if="!subtitleBulkSeriesId" class="p-8 text-center text-zinc-500">{{ t('admin.mediaIngests.subtitles.chooseSeriesHelp') }}</div>
                <div v-else class="divide-y divide-zinc-800">
                  <div v-for="row in subtitleBulkRows" :key="row.targetId" :class="row.included ? 'bg-zinc-900/40' : 'opacity-60'" class="grid gap-3 p-4 md:grid-cols-[3rem_minmax(10rem,0.8fr)_minmax(14rem,1.3fr)_minmax(10rem,0.8fr)] md:items-center">
                    <input v-model="row.included" :disabled="subtitleImporting || row.status === 'done' || !row.sourcePath" type="checkbox" class="h-5 w-5 accent-red-500" />
                    <div class="min-w-0"><p class="truncate font-bold">S{{ row.seasonNumber }} E{{ row.episodeNumber }} · {{ row.targetTitle }}</p><p class="mt-1 text-xs" :class="row.status === 'error' ? 'text-red-300' : row.status === 'done' ? 'text-emerald-300' : row.matchKind ? 'text-cyan-300' : 'text-amber-300'">{{ subtitleRowState(row) }}</p></div>
                    <select v-model="row.sourcePath" :disabled="subtitleImporting || row.status === 'done'" class="min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2" @change="selectSubtitleBulkSource(row)"><option value="">{{ t('admin.mediaIngests.subtitles.excludeEpisode') }}</option><option v-for="source in subtitleSources" :key="source.file_path" :value="source.file_path">{{ source.relative_path }}</option></select>
                    <select v-model.number="row.streamIndex" :disabled="subtitleImporting || row.status === 'done' || !row.sourcePath" class="min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"><option :value="-1">{{ t('admin.mediaIngests.subtitles.selectStream') }}</option><option v-for="stream in subtitleBulkRowSource(row)?.streams || []" :key="stream.index" :value="stream.index">{{ subtitleStreamLabel(stream) }}</option></select>
                    <p v-if="row.error" class="text-xs text-red-300 md:col-start-2 md:col-span-3">{{ row.error }}</p>
                  </div>
                </div>
              </section>
              <div class="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 sm:flex-row sm:items-center sm:justify-between"><p class="text-sm text-zinc-400">{{ t('admin.mediaIngests.subtitles.bulkCount', { count: subtitleBulkReadyRows.length }) }}</p><button type="button" :disabled="!subtitleBulkReadyRows.length || subtitleImporting" class="rounded-lg bg-cyan-700 px-5 py-3 font-bold hover:bg-cyan-600 disabled:opacity-50" @click="importBulkSubtitles">{{ subtitleImporting ? t('admin.mediaIngests.subtitles.bulkImporting', { current: subtitleImportProgress.current, total: subtitleImportProgress.total }) : t('admin.mediaIngests.subtitles.bulkSubmit') }}</button></div>
            </div>
            <p v-if="subtitleMessage" class="mx-auto mt-5 max-w-6xl rounded border border-emerald-500/30 bg-emerald-950/40 p-3 text-sm text-emerald-200">{{ subtitleMessage }}</p>
            <p v-if="subtitlePanelError" class="mx-auto mt-5 max-w-6xl rounded border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{{ subtitlePanelError }}</p>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import AudioSyncEditor from '~/app/components/admin/AudioSyncEditor.vue'
import { attachMediaIngest, bulkAttachSeriesMediaIngest, createMediaIngest, createUploadedMediaIngest, deleteMediaIngest, deleteMediaIngestFiles, importMediaIngestAudioTrack, importMediaIngestSubtitleTrack, listMediaIngestAudioSources, listMediaIngestSubtitleSources, listMediaIngests, pauseMediaIngest, previewSeriesMediaIngest, retryMediaIngest, type MediaIngest, type MediaIngestAudioSource, type MediaIngestAudioStream, type MediaIngestSeriesPreviewFile, type MediaIngestSubtitleSource, type MediaIngestSubtitleStream } from '~/app/service/mediaIngests'
import { uploadFileInChunks } from '~/app/service/upload'
import { listMovies, syncMovieAudioTrack, uploadMovieAudioTrack } from '~/app/service/movies'
import { getSeries, syncSeriesEpisodeAudioTrack, uploadSeriesEpisodeAudioTrack } from '~/app/service/series'
import { resolveMediaUrl } from '~/app/utils/media'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  channels: any[]
  seriesItems?: any[]
}>()

const { t } = useI18n()
const ingests = ref<MediaIngest[]>([])
const creating = ref(false)
const attachingId = ref('')
const actionBusyId = ref('')
const error = ref('')
const message = ref('')
const uploadPanelOpen = ref(false)
const uploadFileInput = ref<HTMLInputElement | null>(null)
const uploadBusy = ref(false)
const uploadError = ref('')
const uploadFiles = ref<Array<{ key: string; file: File; progress: number; status: string }>>([])
const uploadForm = reactive({
  mediaType: 'movie' as 'movie' | 'series',
  title: '',
  year: undefined as number | undefined,
  seasonCount: 1,
})
const uploadAccept = '.mp4,.mkv,.webm,.mov,.avi,.m4v,.mpg,.mpeg,.wmv,.mka,.aac,.mp3,.wav,.flac,.m4a,.ogg,.opus,.ac3,.eac3,.dts,.ts,.m2ts,.srt,.ass,.vtt'
const uploadExtensions = new Set(uploadAccept.split(','))
const attachPanelId = ref('')
const attachPanelItem = computed(() => ingests.value.find(item => item.id === attachPanelId.value) || null)
const audioPanelId = ref('')
const audioPanelItem = computed(() => ingests.value.find(item => item.id === audioPanelId.value) || null)
const audioSources = ref<MediaIngestAudioSource[]>([])
const audioMovies = ref<any[]>([])
const audioEpisodes = ref<any[]>([])
const audioSourcesLoading = ref(false)
const audioImporting = ref(false)
const audioSyncSaving = ref(false)
const audioPanelError = ref('')
const bulkAudioMessage = ref('')
const audioMode = ref<'single' | 'bulk'>('single')
const bulkSeriesId = ref('')
const bulkEpisodes = ref<any[]>([])
const bulkEpisodesLoading = ref(false)
const bulkAudioImporting = ref(false)
const bulkImportProgress = reactive({ current: 0, total: 0 })
const bulkCompletedMappings = ref<string[]>([])
type BulkAudioRow = {
  targetId: string
  targetTitle: string
  seasonNumber: number
  episodeNumber: number
  sourcePath: string
  streamIndex: number
  included: boolean
  matchKind: 'number' | 'title' | 'order' | ''
  status: '' | 'importing' | 'done' | 'error'
  error: string
}
const bulkAudioRows = ref<BulkAudioRow[]>([])
const bulkAudioForm = reactive({
  language: 'es',
  label: 'Español',
  delayMs: 0,
  trimStartMs: 0,
})
const bulkReadyRows = computed(() => bulkAudioRows.value.filter(row => row.included && row.sourcePath && row.streamIndex >= 0 && row.status !== 'done'))
const subtitlePanelId = ref('')
const subtitlePanelItem = computed(() => ingests.value.find(item => item.id === subtitlePanelId.value) || null)
const subtitleSources = ref<MediaIngestSubtitleSource[]>([])
const subtitleSourcesLoading = ref(false)
const subtitleMovies = ref<any[]>([])
const subtitleEpisodes = ref<any[]>([])
const subtitleMode = ref<'single' | 'bulk'>('single')
const subtitleImporting = ref(false)
const subtitlePanelError = ref('')
const subtitleMessage = ref('')
const subtitleForm = reactive({
  targetType: 'movie' as 'movie' | 'episode',
  targetId: '',
  seriesId: '',
  filePath: '',
  streamIndex: -1,
  language: 'es',
  label: 'Español',
  delayMs: 0,
  isDefault: false,
})
type SubtitleBulkRow = BulkAudioRow
const subtitleBulkSeriesId = ref('')
const subtitleBulkEpisodes = ref<any[]>([])
const subtitleBulkRows = ref<SubtitleBulkRow[]>([])
const subtitleBulkForm = reactive({ language: 'es', label: 'Español', delayMs: 0 })
const subtitleImportProgress = reactive({ current: 0, total: 0 })
const subtitleBulkReadyRows = computed(() => subtitleBulkRows.value.filter(row => row.included && row.sourcePath && row.streamIndex >= 0 && row.status !== 'done'))
const selectedSubtitleSource = computed(() => subtitleSources.value.find(source => source.file_path === subtitleForm.filePath) || null)
const canImportSubtitle = computed(() => Boolean(subtitleForm.targetId && subtitleForm.filePath && subtitleForm.streamIndex >= 0))
const importedAudio = ref<null | {
  trackId: string
  videoId: string
  targetType: 'movie' | 'episode'
  targetId: string
  targetTitle: string
  label: string
  language: string
  isDefault: boolean
  uri: string
  delayMs: number
  trimStartMs: number
  sourceFilePath: string
}>(null)
const audioForm = reactive({
  targetType: 'movie' as 'movie' | 'episode',
  targetId: '',
  seriesId: '',
  filePath: '',
  streamIndex: -1,
  language: 'es',
  label: 'Español',
  isDefault: false,
})
const selectedAudioSource = computed(() => audioSources.value.find(source => source.file_path === audioForm.filePath) || null)
const canImportAudio = computed(() => Boolean(audioForm.targetId && audioForm.filePath && audioForm.streamIndex >= 0))
const importedVideoSrc = computed(() => importedAudio.value ? resolveMediaUrl(`/videos/${importedAudio.value.videoId}/master.m3u8`) : '')
const importedCandidateSrc = computed(() => importedAudio.value ? resolveMediaUrl(`/videos/${importedAudio.value.videoId}/${importedAudio.value.uri}`) : '')
let refreshTimer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  media_type: 'movie' as 'movie' | 'series',
  title: '',
  year: undefined as number | undefined,
  season_count: 1,
  source_url: ''
})

const attachForms = reactive<Record<string, {
  channel_id: string
  title: string
  description: string
  file_path: string
  hidden: boolean
  series_id: string
  season_number: number
  episode_number: number
  episode_title: string
}>>({})

const seriesPreviewStates = reactive<Record<string, {
  loading: boolean
  attaching: boolean
  error: string
  files: MediaIngestSeriesPreviewFile[]
}>>({})

const ensureAttachForm = (item: MediaIngest) => {
  if (!attachForms[item.id]) {
    attachForms[item.id] = {
      channel_id: '',
      title: item.title,
      description: '',
      file_path: '',
      hidden: false,
      series_id: '',
      season_number: 1,
      episode_number: 1,
      episode_title: item.title
    }
  }
}

const previewState = (id: string) => {
  if (!seriesPreviewStates[id]) {
    seriesPreviewStates[id] = { loading: false, attaching: false, error: '', files: [] }
  }
  return seriesPreviewStates[id]
}

const isAttachableStatus = (status: string) => ['downloaded', 'paused', 'finished'].includes(status)

const loadIngests = async () => {
  try {
    const items = await listMediaIngests()
    ingests.value = items
    items.forEach(ensureAttachForm)
  } catch (err: any) {
    error.value = err?.response?.data?.error || err?.message || t('admin.mediaIngests.loadError')
  }
}

const submitIngest = async () => {
  creating.value = true
  error.value = ''
  message.value = ''
  try {
    await createMediaIngest({ ...form })
    form.title = ''
    form.year = undefined
    form.season_count = 1
    form.source_url = ''
    message.value = t('admin.mediaIngests.queued')
    await loadIngests()
  } catch (err: any) {
    error.value = err?.response?.data?.error || err?.message || t('admin.mediaIngests.queueError')
  } finally {
    creating.value = false
  }
}

const openUploadPanel = () => {
  uploadError.value = ''
  uploadPanelOpen.value = true
}

const resetUploadPanel = () => {
  uploadFiles.value = []
  uploadForm.mediaType = 'movie'
  uploadForm.title = ''
  uploadForm.year = undefined
  uploadForm.seasonCount = 1
  uploadError.value = ''
  if (uploadFileInput.value) uploadFileInput.value.value = ''
}

const closeUploadPanel = () => {
  if (uploadBusy.value) return
  uploadPanelOpen.value = false
  resetUploadPanel()
}

const addUploadFiles = (files: File[]) => {
  uploadError.value = ''
  const existing = new Set(uploadFiles.value.map(row => `${row.file.name}:${row.file.size}:${row.file.lastModified}`))
  for (const file of files) {
    const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`
    if (!file.size || !uploadExtensions.has(extension)) {
      uploadError.value = t('admin.mediaIngests.upload.unsupported', { name: file.name })
      continue
    }
    const key = `${file.name}:${file.size}:${file.lastModified}`
    if (existing.has(key)) continue
    existing.add(key)
    uploadFiles.value.push({ key, file, progress: 0, status: '' })
  }
  if (!uploadForm.title && uploadFiles.value.length === 1) {
    uploadForm.title = uploadFiles.value[0].file.name.replace(/\.[^.]+$/, '')
  }
}

const onUploadFilesSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  addUploadFiles(Array.from(input.files || []))
  input.value = ''
}

const onUploadDrop = (event: DragEvent) => {
  if (uploadBusy.value) return
  addUploadFiles(Array.from(event.dataTransfer?.files || []))
}

const removeUploadFile = (index: number) => {
  uploadFiles.value.splice(index, 1)
}

const submitUploadedIngest = async () => {
  if (!uploadFiles.value.length || uploadBusy.value) return
  uploadBusy.value = true
  uploadError.value = ''
  try {
    const files: Array<{ upload_id: string; file_name: string }> = []
    for (const row of uploadFiles.value) {
      row.status = t('admin.mediaIngests.upload.uploadingFile')
      const uploadId = await uploadFileInChunks(row.file, progress => {
        row.progress = progress
      })
      row.progress = 100
      row.status = t('admin.mediaIngests.upload.ready')
      files.push({ upload_id: uploadId, file_name: row.file.name })
    }
    await createUploadedMediaIngest({
      media_type: uploadForm.mediaType,
      title: uploadForm.title.trim(),
      year: uploadForm.year,
      season_count: uploadForm.mediaType === 'series' ? uploadForm.seasonCount : 1,
      files,
    })
    message.value = t('admin.mediaIngests.upload.complete')
    uploadPanelOpen.value = false
    resetUploadPanel()
    await loadIngests()
  } catch (err: any) {
    uploadError.value = err?.response?.data?.error || err?.message || t('admin.mediaIngests.upload.error')
  } finally {
    uploadBusy.value = false
  }
}

const canPreviewSeries = (item: MediaIngest) => {
  return item.media_type === 'series' && isAttachableStatus(item.status)
}

const canOpenAttachPanel = (item: MediaIngest) => {
  return isAttachableStatus(item.status) && Boolean(item.content_path || item.save_path)
}

const openAttachPanel = (item: MediaIngest) => {
  ensureAttachForm(item)
  attachPanelId.value = item.id
}

const closeAttachPanel = () => {
  attachPanelId.value = ''
}

const canUseAsAudioSource = (item: MediaIngest) => {
  return Boolean(item.content_path || item.save_path) && !['queued', 'downloading'].includes(item.status)
}

const resetAudioTarget = () => {
  audioForm.targetId = ''
  audioForm.seriesId = ''
  audioEpisodes.value = []
}

const resetImportedAudio = () => {
  importedAudio.value = null
}

const openAudioPanel = async (item: MediaIngest) => {
  audioPanelId.value = item.id
  audioPanelError.value = ''
  bulkAudioMessage.value = ''
  audioSources.value = []
  audioMovies.value = []
  audioEpisodes.value = []
  importedAudio.value = null
  audioMode.value = 'single'
  bulkSeriesId.value = ''
  bulkEpisodes.value = []
  bulkAudioRows.value = []
  bulkCompletedMappings.value = []
  bulkImportProgress.current = 0
  bulkImportProgress.total = 0
  audioForm.targetType = item.media_type === 'series' ? 'episode' : 'movie'
  resetAudioTarget()
  audioForm.filePath = ''
  audioForm.streamIndex = -1
  audioSourcesLoading.value = true
  try {
    const [sourceData, movieData] = await Promise.all([
      listMediaIngestAudioSources(item.id),
      listMovies(),
    ])
    audioSources.value = sourceData.sources || []
    audioMovies.value = movieData.movies || []
    if (audioSources.value.length === 1) {
      audioForm.filePath = audioSources.value[0].file_path
      selectFirstAudioStream()
    }
  } catch (err: any) {
    audioPanelError.value = err?.response?.data?.error || err?.message || t('admin.mediaIngests.audio.inspectError')
  } finally {
    audioSourcesLoading.value = false
  }
}

const closeAudioPanel = () => {
  if (bulkAudioImporting.value) return
  audioPanelId.value = ''
  importedAudio.value = null
  audioPanelError.value = ''
}

const setAudioMode = async (mode: 'single' | 'bulk') => {
  if (bulkAudioImporting.value) return
  audioMode.value = mode
  audioPanelError.value = ''
  if (mode === 'bulk' && !bulkSeriesId.value && audioForm.seriesId) {
    bulkSeriesId.value = audioForm.seriesId
    await loadBulkAudioEpisodes()
  }
}

const loadAudioEpisodes = async () => {
  audioForm.targetId = ''
  audioEpisodes.value = []
  if (!audioForm.seriesId) return
  audioPanelError.value = ''
  try {
    const data = await getSeries(audioForm.seriesId)
    audioEpisodes.value = data.episodes || []
  } catch (err: any) {
    audioPanelError.value = err?.response?.data?.error || err?.message || t('admin.mediaIngests.audio.episodesError')
  }
}

const normalizeLinkText = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\.[^.]+$/, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const numberedSourceMatch = (sourceName: string, episode: any) => {
  const name = sourceName.replace(/\.[^.]+$/, '')
  const seasonEpisode = name.match(/(?:^|[^a-z0-9])s(\d{1,2})[ ._-]*e(\d{1,3})(?:[^a-z0-9]|$)/i)
    || name.match(/(?:^|[^0-9])(\d{1,2})x(\d{1,3})(?:[^0-9]|$)/i)
  if (seasonEpisode) {
    return Number(seasonEpisode[1]) === Number(episode.season_number) && Number(seasonEpisode[2]) === Number(episode.episode_number)
  }
  const episodeOnly = name.match(/(?:episode|episodio|capitulo|chapter|ep)[ ._-]*(\d{1,3})(?:[^0-9]|$)/i)
    || name.match(/^(\d{1,3})(?:[ ._-]|$)/)
  return Boolean(episodeOnly && Number(episodeOnly[1]) === Number(episode.episode_number))
}

const inferBulkAudioRows = () => {
  const usedSources = new Set<string>()
  const episodes = [...bulkEpisodes.value].sort((left, right) => {
    return Number(left.season_number) - Number(right.season_number) || Number(left.episode_number) - Number(right.episode_number)
  })
  bulkAudioRows.value = episodes.map((episode, episodeIndex) => {
    let source = audioSources.value.find(candidate => !usedSources.has(candidate.file_path) && numberedSourceMatch(candidate.relative_path, episode))
    let matchKind: BulkAudioRow['matchKind'] = source ? 'number' : ''
    if (!source) {
      const episodeTitle = normalizeLinkText(String(episode.title || ''))
      if (episodeTitle.length >= 3) {
        source = audioSources.value.find(candidate => {
          if (usedSources.has(candidate.file_path)) return false
          const sourceTitle = normalizeLinkText(candidate.relative_path)
          return sourceTitle.includes(episodeTitle) || episodeTitle.includes(sourceTitle)
        })
        if (source) matchKind = 'title'
      }
    }
    if (!source && audioSources.value.length === episodes.length) {
      const orderedSource = audioSources.value[episodeIndex]
      if (orderedSource && !usedSources.has(orderedSource.file_path)) {
        source = orderedSource
        matchKind = 'order'
      }
    }
    if (source) usedSources.add(source.file_path)
    const mappingKey = source ? `${source.file_path}:${episode.id}` : ''
    const alreadyDone = Boolean(mappingKey && bulkCompletedMappings.value.includes(mappingKey))
    return {
      targetId: episode.id,
      targetTitle: episode.title || `Episode ${episode.episode_number}`,
      seasonNumber: Number(episode.season_number || 1),
      episodeNumber: Number(episode.episode_number || 1),
      sourcePath: source?.file_path || '',
      streamIndex: source?.streams?.[0]?.index ?? -1,
      included: Boolean(source) && !alreadyDone,
      matchKind,
      status: alreadyDone ? 'done' : '',
      error: '',
    } as BulkAudioRow
  })
}

const loadBulkAudioEpisodes = async () => {
  bulkEpisodes.value = []
  bulkAudioRows.value = []
  if (!bulkSeriesId.value) return
  bulkEpisodesLoading.value = true
  audioPanelError.value = ''
  try {
    const data = await getSeries(bulkSeriesId.value)
    bulkEpisodes.value = data.episodes || []
    inferBulkAudioRows()
  } catch (err: any) {
    audioPanelError.value = err?.response?.data?.error || err?.message || t('admin.mediaIngests.audio.episodesError')
  } finally {
    bulkEpisodesLoading.value = false
  }
}

const bulkRowSource = (row: BulkAudioRow) => audioSources.value.find(source => source.file_path === row.sourcePath) || null

const selectBulkSource = (row: BulkAudioRow) => {
  const source = bulkRowSource(row)
  row.streamIndex = source?.streams?.[0]?.index ?? -1
  row.included = Boolean(source)
  row.matchKind = ''
  row.status = ''
  row.error = ''
}

const includeAllBulkMatches = () => {
  bulkAudioRows.value.forEach(row => {
    if (row.sourcePath && row.streamIndex >= 0 && row.status !== 'done') row.included = true
  })
}

const excludeAllBulkRows = () => {
  bulkAudioRows.value.forEach(row => {
    if (row.status !== 'done') row.included = false
  })
}

const bulkMatchLabel = (kind: BulkAudioRow['matchKind']) => {
  if (kind === 'number') return t('admin.mediaIngests.audio.matchedNumber')
  if (kind === 'title') return t('admin.mediaIngests.audio.matchedTitle')
  if (kind === 'order') return t('admin.mediaIngests.audio.matchedOrder')
  return ''
}

const bulkRowStatus = (row: BulkAudioRow) => {
  if (row.status === 'importing') return t('admin.mediaIngests.audio.rowImporting')
  if (row.status === 'done') return t('admin.mediaIngests.audio.rowDone')
  if (row.status === 'error') return t('admin.mediaIngests.audio.rowError')
  return ''
}

const audioStreamLabel = (stream: MediaIngestAudioStream) => {
  const language = stream.tags?.language || 'und'
  const title = stream.tags?.title || ''
  const rate = stream.sample_rate ? `${Math.round(Number(stream.sample_rate) / 1000)} kHz` : ''
  const layout = stream.channels ? `${stream.channels} ch` : ''
  return [`#${stream.index}`, title || language, stream.codec_name?.toUpperCase(), layout, rate].filter(Boolean).join(' · ')
}

const fillAudioStreamMetadata = () => {
  const stream = selectedAudioSource.value?.streams.find(item => item.index === audioForm.streamIndex)
  if (!stream) return
  const language = String(stream.tags?.language || '').trim()
  const title = String(stream.tags?.title || '').trim()
  if (language) audioForm.language = language
  if (title) audioForm.label = title
}

const selectFirstAudioStream = () => {
  const stream = selectedAudioSource.value?.streams[0]
  audioForm.streamIndex = stream?.index ?? -1
  fillAudioStreamMetadata()
}

const importSelectedAudio = async () => {
  const item = audioPanelItem.value
  if (!item || !canImportAudio.value) return
  audioImporting.value = true
  audioPanelError.value = ''
  try {
    const data = await importMediaIngestAudioTrack(item.id, {
      target_type: audioForm.targetType,
      target_id: audioForm.targetId,
      file_path: audioForm.filePath,
      stream_index: audioForm.streamIndex,
      label: audioForm.label,
      language: audioForm.language,
      default: false,
    })
    importedAudio.value = {
      trackId: data.audio_track.id,
      videoId: data.video_id,
      targetType: audioForm.targetType,
      targetId: audioForm.targetId,
      targetTitle: data.target_title || audioForm.label,
      label: data.audio_track.label || audioForm.label,
      language: data.audio_track.language || audioForm.language,
      isDefault: audioForm.isDefault,
      uri: data.audio_track.uri,
      delayMs: Number(data.audio_track.delay_ms || 0),
      trimStartMs: Number(data.audio_track.trim_start_ms || 0),
      sourceFilePath: audioForm.filePath,
    }
  } catch (err: any) {
    audioPanelError.value = err?.response?.data?.error || err?.message || t('admin.mediaIngests.audio.extractError')
  } finally {
    audioImporting.value = false
  }
}

const importBulkAudio = async () => {
  const item = audioPanelItem.value
  const rows = [...bulkReadyRows.value]
  if (!item || !rows.length || bulkAudioImporting.value) return
  bulkAudioImporting.value = true
  audioPanelError.value = ''
  bulkAudioMessage.value = ''
  bulkImportProgress.current = 0
  bulkImportProgress.total = rows.length
  let completed = 0
  let failed = 0
  for (const row of rows) {
    row.status = 'importing'
    row.error = ''
    try {
      await importMediaIngestAudioTrack(item.id, {
        target_type: 'episode',
        target_id: row.targetId,
        file_path: row.sourcePath,
        stream_index: row.streamIndex,
        label: bulkAudioForm.label,
        language: bulkAudioForm.language,
        default: false,
        delay_ms: Number(bulkAudioForm.delayMs || 0),
        trim_start_ms: Math.max(0, Number(bulkAudioForm.trimStartMs || 0)),
      })
      row.status = 'done'
      row.included = false
      completed++
      const key = `${row.sourcePath}:${row.targetId}`
      if (!bulkCompletedMappings.value.includes(key)) bulkCompletedMappings.value.push(key)
    } catch (err: any) {
      row.status = 'error'
      row.error = err?.response?.data?.error || err?.message || t('admin.mediaIngests.audio.extractError')
      failed++
    } finally {
      bulkImportProgress.current++
    }
  }
  bulkAudioImporting.value = false
  bulkAudioMessage.value = t('admin.mediaIngests.audio.bulkComplete', { count: completed })
  if (failed) audioPanelError.value = t('admin.mediaIngests.audio.bulkFailed', { count: failed })
}

const saveImportedAudioSync = async (settings: { delayMs: number; trimStartMs: number }) => {
  const imported = importedAudio.value
  if (!imported) return
  audioSyncSaving.value = true
  audioPanelError.value = ''
  try {
    if (imported.targetType === 'movie') {
      await syncMovieAudioTrack(imported.targetId, imported.trackId, settings)
      if (imported.isDefault) {
        await uploadMovieAudioTrack(imported.targetId, {
          trackId: imported.trackId,
          label: imported.label,
          language: imported.language,
          isDefault: true,
        })
      }
    } else {
      await syncSeriesEpisodeAudioTrack(imported.targetId, imported.trackId, settings)
      if (imported.isDefault) {
        await uploadSeriesEpisodeAudioTrack(imported.targetId, {
          trackId: imported.trackId,
          label: imported.label,
          language: imported.language,
          isDefault: true,
        })
      }
    }
    imported.delayMs = settings.delayMs
    imported.trimStartMs = settings.trimStartMs
    message.value = t('admin.mediaIngests.audio.synced', { title: imported.targetTitle })
    if (imported.targetType === 'episode') {
      bulkAudioForm.language = imported.language
      bulkAudioForm.label = imported.label
      bulkAudioForm.delayMs = settings.delayMs
      bulkAudioForm.trimStartMs = settings.trimStartMs
      const completedKey = `${imported.sourceFilePath}:${imported.targetId}`
      if (!bulkCompletedMappings.value.includes(completedKey)) bulkCompletedMappings.value.push(completedKey)
      if (audioForm.seriesId) {
        bulkSeriesId.value = audioForm.seriesId
        await loadBulkAudioEpisodes()
      }
      importedAudio.value = null
      audioMode.value = 'bulk'
      bulkAudioMessage.value = t('admin.mediaIngests.audio.timingApplied')
    } else {
      closeAudioPanel()
    }
  } catch (err: any) {
    audioPanelError.value = err?.response?.data?.error || err?.message || t('admin.mediaIngests.audio.syncError')
  } finally {
    audioSyncSaving.value = false
  }
}

const openSubtitlePanel = async (item: MediaIngest) => {
  subtitlePanelId.value = item.id
  subtitleMode.value = 'single'
  subtitleSources.value = []
  subtitleMovies.value = []
  subtitleEpisodes.value = []
  subtitleBulkEpisodes.value = []
  subtitleBulkRows.value = []
  subtitleBulkSeriesId.value = ''
  subtitlePanelError.value = ''
  subtitleMessage.value = ''
  subtitleForm.targetType = item.media_type === 'series' ? 'episode' : 'movie'
  resetSubtitleTarget()
  subtitleForm.filePath = ''
  subtitleForm.streamIndex = -1
  subtitleSourcesLoading.value = true
  try {
    const [sourceData, movieData] = await Promise.all([
      listMediaIngestSubtitleSources(item.id),
      listMovies(),
    ])
    subtitleSources.value = sourceData.sources || []
    subtitleMovies.value = movieData.movies || []
    if (subtitleSources.value.length === 1) {
      subtitleForm.filePath = subtitleSources.value[0].file_path
      selectFirstSubtitleStream()
    }
  } catch (err: any) {
    subtitlePanelError.value = err?.response?.data?.error || err?.message || t('admin.mediaIngests.subtitles.inspectError')
  } finally {
    subtitleSourcesLoading.value = false
  }
}

const closeSubtitlePanel = () => {
  if (subtitleImporting.value) return
  subtitlePanelId.value = ''
}

const resetSubtitleTarget = () => {
  subtitleForm.targetId = ''
  subtitleForm.seriesId = ''
  subtitleEpisodes.value = []
}

const loadSubtitleEpisodes = async () => {
  subtitleForm.targetId = ''
  subtitleEpisodes.value = []
  if (!subtitleForm.seriesId) return
  subtitlePanelError.value = ''
  try {
    const data = await getSeries(subtitleForm.seriesId)
    subtitleEpisodes.value = data.episodes || []
  } catch (err: any) {
    subtitlePanelError.value = err?.response?.data?.error || err?.message || t('admin.mediaIngests.subtitles.episodesError')
  }
}

const subtitleStreamLabel = (stream: MediaIngestSubtitleStream) => {
  const language = stream.tags?.language || 'und'
  const title = stream.tags?.title || ''
  const flags = [stream.disposition?.forced ? t('admin.mediaIngests.subtitles.forced') : '', stream.disposition?.default ? t('admin.mediaIngests.subtitles.sourceDefault') : ''].filter(Boolean)
  return [`#${stream.index}`, title || language, stream.codec_name?.toUpperCase(), ...flags].filter(Boolean).join(' · ')
}

const fillSubtitleMetadata = () => {
  const stream = selectedSubtitleSource.value?.streams.find(item => item.index === subtitleForm.streamIndex)
  if (!stream) return
  if (stream.tags?.language) subtitleForm.language = stream.tags.language
  if (stream.tags?.title) subtitleForm.label = stream.tags.title
}

const selectFirstSubtitleStream = () => {
  subtitleForm.streamIndex = selectedSubtitleSource.value?.streams?.[0]?.index ?? -1
  fillSubtitleMetadata()
}

const importSelectedSubtitle = async () => {
  const item = subtitlePanelItem.value
  if (!item || !canImportSubtitle.value) return
  subtitleImporting.value = true
  subtitlePanelError.value = ''
  subtitleMessage.value = ''
  try {
    const data = await importMediaIngestSubtitleTrack(item.id, {
      target_type: subtitleForm.targetType,
      target_id: subtitleForm.targetId,
      file_path: subtitleForm.filePath,
      stream_index: subtitleForm.streamIndex,
      label: subtitleForm.label,
      language: subtitleForm.language,
      default: subtitleForm.isDefault,
      delay_ms: Number(subtitleForm.delayMs || 0),
    })
    subtitleMessage.value = t('admin.mediaIngests.subtitles.imported', { title: data.target_title || subtitleForm.label })
  } catch (err: any) {
    subtitlePanelError.value = err?.response?.data?.error || err?.message || t('admin.mediaIngests.subtitles.importError')
  } finally {
    subtitleImporting.value = false
  }
}

const inferSubtitleBulkRows = () => {
  const usedSources = new Set<string>()
  const episodes = [...subtitleBulkEpisodes.value].sort((left, right) => Number(left.season_number) - Number(right.season_number) || Number(left.episode_number) - Number(right.episode_number))
  subtitleBulkRows.value = episodes.map((episode, index) => {
    let source = subtitleSources.value.find(candidate => !usedSources.has(candidate.file_path) && numberedSourceMatch(candidate.relative_path, episode))
    let matchKind: SubtitleBulkRow['matchKind'] = source ? 'number' : ''
    if (!source) {
      const title = normalizeLinkText(String(episode.title || ''))
      if (title.length >= 3) {
        source = subtitleSources.value.find(candidate => !usedSources.has(candidate.file_path) && normalizeLinkText(candidate.relative_path).includes(title))
        if (source) matchKind = 'title'
      }
    }
    if (!source && subtitleSources.value.length === episodes.length) {
      const ordered = subtitleSources.value[index]
      if (ordered && !usedSources.has(ordered.file_path)) {
        source = ordered
        matchKind = 'order'
      }
    }
    if (source) usedSources.add(source.file_path)
    return {
      targetId: episode.id,
      targetTitle: episode.title || `Episode ${episode.episode_number}`,
      seasonNumber: Number(episode.season_number || 1),
      episodeNumber: Number(episode.episode_number || 1),
      sourcePath: source?.file_path || '',
      streamIndex: source?.streams?.[0]?.index ?? -1,
      included: Boolean(source),
      matchKind,
      status: '',
      error: '',
    } as SubtitleBulkRow
  })
}

const loadSubtitleBulkEpisodes = async () => {
  subtitleBulkRows.value = []
  subtitleBulkEpisodes.value = []
  if (!subtitleBulkSeriesId.value) return
  subtitlePanelError.value = ''
  try {
    const data = await getSeries(subtitleBulkSeriesId.value)
    subtitleBulkEpisodes.value = data.episodes || []
    inferSubtitleBulkRows()
  } catch (err: any) {
    subtitlePanelError.value = err?.response?.data?.error || err?.message || t('admin.mediaIngests.subtitles.episodesError')
  }
}

const subtitleBulkRowSource = (row: SubtitleBulkRow) => subtitleSources.value.find(source => source.file_path === row.sourcePath) || null

const selectSubtitleBulkSource = (row: SubtitleBulkRow) => {
  const source = subtitleBulkRowSource(row)
  row.streamIndex = source?.streams?.[0]?.index ?? -1
  row.included = Boolean(source)
  row.matchKind = ''
  row.status = ''
  row.error = ''
}

const subtitleRowState = (row: SubtitleBulkRow) => {
  if (row.status === 'importing') return t('admin.mediaIngests.subtitles.rowImporting')
  if (row.status === 'done') return t('admin.mediaIngests.subtitles.rowDone')
  if (row.status === 'error') return t('admin.mediaIngests.subtitles.rowError')
  if (row.matchKind) return bulkMatchLabel(row.matchKind)
  return t('admin.mediaIngests.subtitles.noMatch')
}

const importBulkSubtitles = async () => {
  const item = subtitlePanelItem.value
  const rows = [...subtitleBulkReadyRows.value]
  if (!item || !rows.length || subtitleImporting.value) return
  subtitleImporting.value = true
  subtitlePanelError.value = ''
  subtitleMessage.value = ''
  subtitleImportProgress.current = 0
  subtitleImportProgress.total = rows.length
  let completed = 0
  let failed = 0
  for (const row of rows) {
    row.status = 'importing'
    row.error = ''
    try {
      await importMediaIngestSubtitleTrack(item.id, {
        target_type: 'episode',
        target_id: row.targetId,
        file_path: row.sourcePath,
        stream_index: row.streamIndex,
        label: subtitleBulkForm.label,
        language: subtitleBulkForm.language,
        default: false,
        delay_ms: Number(subtitleBulkForm.delayMs || 0),
      })
      row.status = 'done'
      row.included = false
      completed++
    } catch (err: any) {
      row.status = 'error'
      row.error = err?.response?.data?.error || err?.message || t('admin.mediaIngests.subtitles.importError')
      failed++
    } finally {
      subtitleImportProgress.current++
    }
  }
  subtitleImporting.value = false
  subtitleMessage.value = t('admin.mediaIngests.subtitles.bulkComplete', { count: completed })
  if (failed) subtitlePanelError.value = t('admin.mediaIngests.subtitles.bulkFailed', { count: failed })
}

const selectedSeries = (item: MediaIngest) => {
  const seriesId = attachForms[item.id]?.series_id
  if (!seriesId) return null
  return (props.seriesItems || []).find(series => series.id === seriesId) || null
}

const seasonOptions = (item: MediaIngest) => {
  const series = selectedSeries(item)
  const count = Math.max(1, Number(item.season_count || 1), Number(series?.seasons || 0))
  return Array.from({ length: count }, (_, index) => index + 1)
}

const normalizeSeriesPreview = (id: string) => {
  const state = previewState(id)
  const maxSeason = Math.max(1, ...state.files.map(file => Number(file.season_number || 1)))
  const ordered: MediaIngestSeriesPreviewFile[] = []
  for (let season = 1; season <= maxSeason; season++) {
    const seasonFiles = state.files.filter(file => Number(file.season_number || 1) === season)
    seasonFiles.forEach((file, index) => {
      file.season_number = season
      file.episode_number = index + 1
      ordered.push(file)
    })
  }
  state.files.splice(0, state.files.length, ...ordered)
}

const loadSeriesPreview = async (item: MediaIngest) => {
  const state = previewState(item.id)
  state.loading = true
  state.error = ''
  try {
    const data = await previewSeriesMediaIngest(item.id)
    state.files = (data.files || []).map(file => ({ ...file }))
    normalizeSeriesPreview(item.id)
    if (!state.files.length) {
      state.error = t('admin.mediaIngests.previewEmpty')
    }
  } catch (err: any) {
    state.error = err?.response?.data?.error || err?.message || t('admin.mediaIngests.previewError')
  } finally {
    state.loading = false
  }
}

const moveSeriesPreviewEpisode = (id: string, file: MediaIngestSeriesPreviewFile, direction: number) => {
  const state = previewState(id)
  const sameSeason = state.files.filter(entry => Number(entry.season_number) === Number(file.season_number))
  const seasonIndex = sameSeason.findIndex(entry => entry.file_path === file.file_path)
  const target = seasonIndex + direction
  if (seasonIndex < 0 || target < 0 || target >= sameSeason.length) return
  const currentIndex = state.files.findIndex(entry => entry.file_path === sameSeason[seasonIndex].file_path)
  const targetIndex = state.files.findIndex(entry => entry.file_path === sameSeason[target].file_path)
  if (currentIndex < 0 || targetIndex < 0) return
  const [removed] = state.files.splice(currentIndex, 1)
  state.files.splice(targetIndex, 0, removed)
  normalizeSeriesPreview(id)
}

const canBulkAttachSeries = (item: MediaIngest) => {
  const state = previewState(item.id)
  return canPreviewSeries(item) && Boolean(attachForms[item.id]?.channel_id) && state.files.length > 0
}

const bulkAttachSeries = async (item: MediaIngest) => {
  const attachForm = attachForms[item.id]
  const state = previewState(item.id)
  if (!attachForm || !state.files.length) return
  if (item.attached_video_id && !confirm(t('admin.mediaIngests.attachAgainConfirm', { title: item.title }))) return
  state.attaching = true
  state.error = ''
  error.value = ''
  message.value = ''
  try {
    await bulkAttachSeriesMediaIngest(item.id, {
      channel_id: attachForm.channel_id,
      title: attachForm.title || item.title,
      description: attachForm.description,
      hidden: attachForm.hidden,
      series_id: attachForm.series_id,
      episodes: state.files.map(file => ({
        file_path: file.file_path,
        season_number: file.season_number || 1,
        episode_number: file.episode_number || 1,
        episode_title: file.title || file.file_name || attachForm.title || item.title,
        episode_synopsis: attachForm.description
      }))
    })
    message.value = t('admin.mediaIngests.bulkAttachQueued')
    await loadIngests()
    closeAttachPanel()
  } catch (err: any) {
    state.error = err?.response?.data?.error || err?.message || t('admin.mediaIngests.attachError')
  } finally {
    state.attaching = false
  }
}

const canAttach = (item: MediaIngest) => {
  return isAttachableStatus(item.status) && Boolean(attachForms[item.id]?.channel_id)
}

const canRetry = (item: MediaIngest) => {
  if (!item.attached_video_id) return ['failed', 'paused', 'queued'].includes(item.status)
  return item.status === 'failed' || item.video_status === 'failed'
}

const canPause = (item: MediaIngest) => {
  return !item.attached_video_id && ['queued', 'downloading'].includes(item.status)
}

const canDeleteFiles = (item: MediaIngest) => {
  return ['downloaded', 'finished'].includes(item.status) && (Boolean(item.qbittorrent_hash) || item.source_url.startsWith('upload://'))
}

const canDelete = (item: MediaIngest) => {
  return !item.attached_video_id && !['attaching', 'transcoding', 'finished'].includes(item.status)
}

const runIngestAction = async (item: MediaIngest, action: () => Promise<any>, successMessage: string) => {
  actionBusyId.value = item.id
  error.value = ''
  message.value = ''
  try {
    await action()
    message.value = successMessage
    await loadIngests()
  } catch (err: any) {
    error.value = err?.response?.data?.error || err?.message || t('admin.mediaIngests.actionError')
  } finally {
    actionBusyId.value = ''
  }
}

const retry = async (item: MediaIngest) => {
  await runIngestAction(item, () => retryMediaIngest(item.id), t('admin.mediaIngests.retryQueued'))
}

const pause = async (item: MediaIngest) => {
  await runIngestAction(item, () => pauseMediaIngest(item.id), t('admin.mediaIngests.paused'))
}

const removeFiles = async (item: MediaIngest) => {
  if (!confirm(t('admin.mediaIngests.deleteFilesConfirm', { title: item.title }))) return
  await runIngestAction(item, () => deleteMediaIngestFiles(item.id), t('admin.mediaIngests.filesDeleted'))
}

const remove = async (item: MediaIngest) => {
  if (!confirm(t('admin.mediaIngests.deleteConfirm'))) return
  await runIngestAction(item, () => deleteMediaIngest(item.id), t('admin.mediaIngests.deleted'))
}

const attach = async (item: MediaIngest) => {
  const attachForm = attachForms[item.id]
  if (!attachForm) return
  if (item.attached_video_id && !confirm(t('admin.mediaIngests.attachAgainConfirm', { title: item.title }))) return
  attachingId.value = item.id
  error.value = ''
  message.value = ''
  try {
    await attachMediaIngest(item.id, {
      channel_id: attachForm.channel_id,
      title: attachForm.title || item.title,
      description: attachForm.description,
      file_path: attachForm.file_path,
      hidden: attachForm.hidden,
      series_id: attachForm.series_id,
      season_number: attachForm.season_number || 1,
      episode_number: attachForm.episode_number || 1,
      episode_title: attachForm.episode_title || attachForm.title || item.title,
      episode_synopsis: attachForm.description
    })
    message.value = t('admin.mediaIngests.attachQueued')
    await loadIngests()
    closeAttachPanel()
  } catch (err: any) {
    error.value = err?.response?.data?.error || err?.message || t('admin.mediaIngests.attachError')
  } finally {
    attachingId.value = ''
  }
}

const displayProgress = (item: MediaIngest) => {
  if (item.status === 'finished') return 100
  if (item.status === 'transcoding') return Math.max(0, Math.min(100, item.video_progress || Math.round((item.progress || 0) * 100)))
  return Math.max(0, Math.min(100, Math.round((item.progress || 0) * 100)))
}

const formatBytes = (bytes: number) => {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`
}

const formatSpeed = (bytesPerSecond: number) => {
  if (!bytesPerSecond) return ''
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  let value = bytesPerSecond
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`
}

const formatEta = (seconds: number) => {
  if (!seconds || seconds < 0) return ''
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${Math.max(1, minutes)}m`
}

const statusClass = (status: string) => {
  switch (status) {
    case 'finished':
      return 'bg-emerald-950 text-emerald-200'
    case 'transcoding':
    case 'attaching':
      return 'bg-blue-950 text-blue-200'
    case 'downloaded':
      return 'bg-purple-950 text-purple-200'
    case 'failed':
      return 'bg-red-950 text-red-200'
    case 'paused':
      return 'bg-amber-950 text-amber-200'
    case 'files_deleted':
      return 'bg-zinc-800 text-zinc-400'
    default:
      return 'bg-zinc-800 text-zinc-200'
  }
}

const statusLabel = (status: string) => {
  if (status === 'files_deleted') return t('admin.mediaIngests.statuses.filesDeleted')
  return status
}

onMounted(() => {
  loadIngests()
  refreshTimer = setInterval(loadIngests, 8000)
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})

watch([attachPanelItem, audioPanelItem, subtitlePanelItem, uploadPanelOpen], ([attachItem, audioItem, subtitleItem, uploadOpen]) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = attachItem || audioItem || subtitleItem || uploadOpen ? 'hidden' : ''
})
</script>
