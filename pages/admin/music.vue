<template>
  <main class="mx-auto max-w-[96rem] px-3 py-5 sm:px-6 sm:py-8">
    <header class="mb-7 flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <NuxtLink :to="localePath('/admin')" class="text-sm text-zinc-400 hover:text-white">{{ t('musicAdmin.back') }}</NuxtLink>
        <h1 class="mt-2 text-3xl font-bold text-white">{{ t('musicAdmin.title') }}</h1>
        <p class="mt-1 text-sm text-zinc-400">{{ t('musicAdmin.subtitle') }}</p>
      </div>
      <NuxtLink :to="localePath('/music')" class="rounded-md border border-zinc-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-zinc-800">
        {{ t('musicAdmin.openMusic') }}
      </NuxtLink>
    </header>

    <div v-if="loading" class="py-24 text-center text-zinc-400">{{ t('musicAdmin.loading') }}</div>
    <div v-else-if="accessError" class="border border-red-900 bg-red-950/30 p-5 text-red-200">{{ accessError }}</div>
    <template v-else>
      <section class="stats-grid mb-7">
        <div><span>{{ t('musicAdmin.artists') }}</span><strong>{{ overview.artists }}</strong></div>
        <div><span>{{ t('musicAdmin.releases') }}</span><strong>{{ overview.releases }}</strong></div>
        <div><span>{{ t('musicAdmin.tracks') }}</span><strong>{{ overview.tracks }}</strong></div>
        <div><span>{{ t('musicAdmin.published') }}</span><strong class="text-emerald-400">{{ overview.published }}</strong></div>
        <div><span>{{ t('musicAdmin.blocked') }}</span><strong :class="overview.blocked ? 'text-amber-400' : 'text-zinc-100'">{{ overview.blocked }}</strong></div>
      </section>

      <div v-if="notice" class="mb-5 border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">{{ notice }}</div>
      <div v-if="actionError" class="mb-5 border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-200">{{ actionError }}</div>

      <nav class="mb-5 flex border-b border-zinc-800" :aria-label="t('musicAdmin.sections')">
        <button v-for="item in tabs" :key="item.id" type="button" :class="{ active: tab === item.id }" @click="tab = item.id">
          {{ item.label }} <span>{{ item.count }}</span>
        </button>
      </nav>

      <section v-if="tab === 'artists'">
        <div class="section-toolbar">
          <div>
            <h2>{{ t('musicAdmin.artists') }}</h2>
            <p>{{ t('musicAdmin.artist.help') }}</p>
          </div>
          <button type="button" class="primary-action" @click="openArtist()">{{ t('musicAdmin.artist.new') }}</button>
        </div>
        <div class="catalog-table">
          <table>
            <thead><tr><th>{{ t('music.common.artist') }}</th><th>{{ t('musicAdmin.artist.primaryChannel') }}</th><th>{{ t('musicAdmin.artist.slug') }}</th><th>{{ t('musicAdmin.state') }}</th><th><span class="sr-only">{{ t('musicAdmin.actions') }}</span></th></tr></thead>
            <tbody>
              <tr v-for="artist in artists" :key="artist.id">
                <td><strong>{{ artist.name }}</strong><small>{{ artist.bio || t('musicAdmin.artist.noBio') }}</small></td>
                <td>{{ artist.channel_name || t('musicAdmin.artist.musicOnly') }}</td>
                <td class="muted">{{ artist.slug }}</td>
                <td><span class="status">{{ artist.verified ? t('musicAdmin.artist.verified') : t('musicAdmin.artist.standard') }}</span></td>
                <td class="actions">
                  <button type="button" @click="openArtist(artist)">{{ t('musicAdmin.edit') }}</button>
                  <button type="button" class="danger" @click="removeArtist(artist)">{{ t('musicAdmin.delete') }}</button>
                </td>
              </tr>
              <tr v-if="!artists.length"><td colspan="5" class="empty">{{ t('musicAdmin.artist.empty') }}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="tab === 'releases'">
        <div class="section-toolbar">
          <div>
            <h2>{{ t('musicAdmin.releases') }}</h2>
            <p>{{ t('musicAdmin.release.help') }}</p>
          </div>
          <button type="button" class="primary-action" :disabled="!artists.length" @click="openRelease()">{{ t('musicAdmin.release.new') }}</button>
        </div>
        <div class="catalog-table">
          <table>
            <thead><tr><th>{{ t('musicAdmin.release.release') }}</th><th>{{ t('musicAdmin.release.artist') }}</th><th>{{ t('musicAdmin.release.type') }}</th><th>{{ t('musicAdmin.tracks') }}</th><th>{{ t('musicAdmin.release.rights') }}</th><th>{{ t('musicAdmin.status') }}</th><th><span class="sr-only">{{ t('musicAdmin.actions') }}</span></th></tr></thead>
            <tbody>
              <tr v-for="release in releases" :key="release.id">
                <td class="release-cell">
                  <img v-if="release.cover_url" :src="imageVariantUrl(release.cover_url, 'sm')" alt="">
                  <div v-else class="cover-empty" />
                  <span><strong>{{ release.title }}</strong><small>{{ release.release_date ? formatDate(release.release_date) : t('musicAdmin.release.dateNotSet') }}</small></span>
                </td>
                <td>{{ release.artist_name }}</td>
                <td class="capitalize">{{ releaseTypeLabel(release.release_type) }}</td>
                <td>{{ release.track_count }}</td>
                <td><span :class="releaseRightsReady(release) ? 'text-emerald-400' : 'text-amber-400'">{{ releaseRightsReady(release) ? t('musicAdmin.release.complete') : t('musicAdmin.release.incomplete') }}</span></td>
                <td><span class="status" :class="release.status">{{ statusLabel(release.status) }}</span></td>
                <td class="actions">
                  <button type="button" @click="openRelease(release)">{{ t('musicAdmin.edit') }}</button>
                  <button v-if="release.status === 'draft'" type="button" @click="setReleasePublished(release, true)">{{ t('musicAdmin.publish') }}</button>
                  <button v-else type="button" @click="setReleasePublished(release, false)">{{ t('musicAdmin.unpublish') }}</button>
                  <button type="button" class="danger" @click="removeRelease(release)">{{ t('musicAdmin.delete') }}</button>
                </td>
              </tr>
              <tr v-if="!releases.length"><td colspan="7" class="empty">{{ t('musicAdmin.release.empty') }}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="tab === 'tracks'">
        <div class="section-toolbar">
          <div>
            <h2>{{ t('musicAdmin.tracks') }}</h2>
            <p>{{ t('musicAdmin.track.help') }}</p>
          </div>
          <div class="toolbar-actions">
            <button type="button" @click="openQuickUpload">{{ t('musicAdmin.track.quickUpload') }}</button>
            <button type="button" :disabled="!releases.length" @click="openBulkImport">{{ t('musicAdmin.track.import') }}</button>
            <button type="button" class="primary-action" :disabled="!releases.length" @click="openTrack()">{{ t('musicAdmin.track.new') }}</button>
          </div>
        </div>
        <div v-if="trackGroups.length" class="track-groups">
          <details v-for="group in trackGroups" :key="group.release.id" class="track-release-group" open>
            <summary>
              <span class="release-cell">
                <img v-if="group.release.cover_url" :src="imageVariantUrl(group.release.cover_url, 'sm')" alt="">
                <span v-else class="cover-empty" />
                <span>
                  <strong>{{ group.release.title }}</strong>
                  <small>{{ group.release.artist_name }} · {{ group.release.release_type }}</small>
                </span>
              </span>
              <span class="group-summary-meta">
                <span>{{ t('musicAdmin.track.ready', { ready: group.readyCount, total: group.tracks.length }) }}</span>
                <span class="status" :class="group.release.status">{{ statusLabel(group.release.status) }}</span>
                <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
              </span>
            </summary>

            <div class="track-group-toolbar">
              <span>{{ t('musicAdmin.track.ordered') }}</span>
              <div>
                <button type="button" @click="openRelease(group.release)">{{ t('musicAdmin.track.editRelease') }}</button>
                <button type="button" :disabled="syncingReleaseLyricsID === group.release.id" @click="syncReleaseLyrics(group)">
                  {{ syncingReleaseLyricsID === group.release.id ? t('musicAdmin.track.syncingLyrics') : t('musicAdmin.track.syncReleaseLyrics') }}
                </button>
                <button v-if="group.release.status === 'draft'" type="button" @click="setReleasePublished(group.release, true)">{{ t('musicAdmin.publishRelease') }}</button>
                <button v-else type="button" @click="setReleasePublished(group.release, false)">{{ t('musicAdmin.unpublishRelease') }}</button>
              </div>
            </div>

            <div class="catalog-table grouped-track-table">
              <table>
                <thead><tr><th>{{ t('musicAdmin.track.position') }}</th><th>{{ t('musicAdmin.track.track') }}</th><th>{{ t('musicAdmin.track.audio') }}</th><th>{{ t('musicAdmin.track.lyrics') }}</th><th>{{ t('musicAdmin.track.video') }}</th><th>{{ t('musicAdmin.state') }}</th><th><span class="sr-only">{{ t('musicAdmin.actions') }}</span></th></tr></thead>
                <tbody>
                  <tr v-for="track in group.tracks" :key="track.id">
                    <td class="track-position">{{ track.disc_number }}.{{ track.track_number }}</td>
                    <td><strong>{{ track.title }}</strong><small>{{ track.artist_name }}</small></td>
                    <td>
                      <span :class="track.audio_url ? 'text-emerald-400' : 'text-amber-400'">{{ track.audio_url ? track.audio_original_name : t('musicAdmin.track.missingAudio') }}</span>
                      <small v-if="track.audio_url">{{ audioFormatLabel(track) }}</small>
                    </td>
                    <td>
                      <span :class="lyricsStatusClass(track)">{{ lyricsStatusLabel(track) }}</span>
                      <small v-if="track.lyrics_source">{{ track.lyrics_source }}</small>
                    </td>
                    <td>
                      <span :class="track.official_video_id ? 'text-zinc-300' : 'text-zinc-500'">{{ track.official_video_id ? t('musicAdmin.track.linked') : t('musicAdmin.track.none') }}</span>
                    </td>
                    <td>
                      <span v-if="trackPublishProblems(track).length" class="text-amber-400">{{ trackPublishProblems(track).join(', ') }}</span>
                      <span v-else class="status" :class="track.status">{{ statusLabel(track.status) }}</span>
                    </td>
                    <td class="actions">
                      <button type="button" @click="openTrack(track)">{{ t('musicAdmin.edit') }}</button>
                      <button type="button" :disabled="syncingLyricsID === track.id" @click="syncLyrics(track)">
                        {{ syncingLyricsID === track.id ? t('musicAdmin.track.syncing') : t('musicAdmin.track.syncLyrics') }}
                      </button>
                      <button type="button" class="danger" @click="removeTrack(track)">{{ t('musicAdmin.delete') }}</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>
        <div v-else class="empty track-empty">{{ t('musicAdmin.track.empty') }}</div>
      </section>
    </template>

    <Teleport to="body">
      <div v-if="editor" class="editor-backdrop" @click.self="closeEditor">
        <form class="editor-panel" @submit.prevent="saveEditor">
        <header>
          <div>
            <p>{{ editorKindLabel(editor.kind) }}</p>
            <h2>{{ t(editor.id ? 'musicAdmin.editor.edit' : 'musicAdmin.editor.new', { kind: editorKindLabel(editor.kind) }) }}</h2>
          </div>
          <button type="button" :aria-label="t('musicAdmin.editor.close')" :title="t('common.close')" @click="closeEditor">×</button>
        </header>

        <div v-if="editor.kind === 'artist'" class="editor-fields">
          <label><span>{{ t('musicAdmin.artist.name') }}</span><input v-model="artistForm.name" required></label>
          <label>
            <span>{{ t('musicAdmin.artist.primaryChannel') }} <small>{{ t('musicAdmin.editor.optional') }}</small></span>
            <select v-model="artistForm.primary_channel_id">
              <option value="">{{ t('musicAdmin.artist.noChannel') }}</option>
              <option v-for="channel in availableArtistChannels" :key="channel.id" :value="channel.id">{{ channel.name }} · {{ channel.username }}</option>
            </select>
          </label>
          <label class="wide">
            <span>{{ t('musicAdmin.artist.image') }} <small>{{ t('musicAdmin.editor.optional') }}</small></span>
            <input type="file" accept="image/*" @change="pickArtistAvatar">
            <small>{{ t('musicAdmin.artist.imageHelp') }}</small>
          </label>
          <label class="wide"><span>{{ t('musicAdmin.artist.bio') }}</span><textarea v-model="artistForm.bio" rows="5" /></label>
          <label class="check wide"><input v-model="artistForm.verified" type="checkbox"><span>{{ t('musicAdmin.artist.verifiedArtist') }}</span></label>
        </div>

        <div v-if="editor.kind === 'release'" class="editor-fields">
          <label>
            <span>{{ t('music.common.artist') }}</span>
            <select v-model="releaseForm.artist_id" required>
              <option value="" disabled>{{ t('musicAdmin.release.selectArtist') }}</option>
              <option v-for="artist in artists" :key="artist.id" :value="artist.id">{{ artist.name }}</option>
            </select>
          </label>
          <label><span>{{ t('musicAdmin.release.title') }}</span><input v-model="releaseForm.title" required></label>
          <label>
            <span>{{ t('musicAdmin.release.typeLabel') }}</span>
            <select v-model="releaseForm.release_type"><option value="single">{{ t('musicAdmin.release.single') }}</option><option value="ep">{{ t('musicAdmin.release.ep') }}</option><option value="album">{{ t('musicAdmin.release.album') }}</option></select>
          </label>
          <label><span>{{ t('musicAdmin.release.date') }}</span><input v-model="releaseForm.release_date" type="date"></label>
          <div v-if="editingRelease?.cover_url" class="release-cover-preview wide">
            <img :src="imageVariantUrl(editingRelease.cover_url, 'sm')" :alt="t('music.common.coverAlt', { title: editingRelease.title })">
            <div><strong>{{ t('musicAdmin.release.currentCover') }}</strong><small>{{ t('musicAdmin.release.currentCoverHelp') }}</small></div>
          </div>
          <label class="wide">
            <span>{{ t('musicAdmin.release.cover') }}</span>
            <input :key="coverInputKey" type="file" accept="image/*" @change="pickCover">
          </label>
          <div v-if="editor.id && releaseArtworkTracks.length" class="embedded-artwork-picker wide">
            <div>
              <strong>{{ t('musicAdmin.release.useTrackArtwork') }}</strong>
              <small>{{ t('musicAdmin.release.trackArtworkHelp') }}</small>
            </div>
            <select v-model="embeddedArtworkTrackID" :disabled="extractingArtwork">
              <option v-for="track in releaseArtworkTracks" :key="track.id" :value="track.id">
                {{ track.disc_number }}.{{ track.track_number }} · {{ track.title }}
              </option>
            </select>
            <button
              type="button"
              :disabled="!embeddedArtworkTrackID || extractingArtwork"
              @click="applyEmbeddedArtwork"
            >
              {{ extractingArtwork ? t('musicAdmin.release.extracting') : t('musicAdmin.release.useArtwork') }}
            </button>
          </div>
          <label class="wide"><span>{{ t('musicAdmin.release.label') }}</span><input v-model="releaseForm.label"></label>
          <label class="wide"><span>{{ t('musicAdmin.release.copyright') }}</span><input v-model="releaseForm.copyright_text" placeholder="© 2026 Rights holder"></label>
          <label class="wide"><span>{{ t('musicAdmin.release.phonogram') }}</span><input v-model="releaseForm.phonogram_text" placeholder="℗ 2026 Rights holder"></label>
          <label class="wide"><span>{{ t('musicAdmin.release.territories') }}</span><input v-model="releaseForm.territories" :placeholder="t('musicAdmin.release.territoriesPlaceholder')"></label>
          <label class="check wide"><input v-model="releaseForm.rights_confirmed" type="checkbox"><span>{{ t('musicAdmin.release.rightsConfirm') }}</span></label>
        </div>

        <div v-if="editor.kind === 'track'" class="editor-fields">
          <label class="wide">
            <span>{{ t('musicAdmin.release.release') }}</span>
            <select v-model="trackForm.release_id" required>
              <option value="" disabled>{{ t('musicAdmin.track.selectRelease') }}</option>
              <option v-for="release in releases" :key="release.id" :value="release.id">{{ release.artist_name }} · {{ release.title }}</option>
            </select>
          </label>
          <label class="wide"><span>{{ t('musicAdmin.track.title') }}</span><input v-model="trackForm.title" required></label>
          <label><span>{{ t('musicAdmin.track.disc') }}</span><input v-model.number="trackForm.disc_number" type="number" min="1" required></label>
          <label><span>{{ t('musicAdmin.track.number') }}</span><input v-model.number="trackForm.track_number" type="number" min="1" required></label>
          <label><span>ISRC</span><input v-model="trackForm.isrc"></label>
          <label><span>{{ t('musicAdmin.track.language') }}</span><input v-model="trackForm.language" :placeholder="t('videoEditor.languagePlaceholder')"></label>
          <label class="check"><input v-model="trackForm.explicit" type="checkbox"><span>{{ t('musicAdmin.track.explicit') }}</span></label>
          <label class="wide">
            <span>{{ t('musicAdmin.track.master') }}</span>
            <input type="file" accept="audio/*,.flac,.wav,.opus" @change="pickAudio">
            <small>{{ t('musicAdmin.track.masterHelp') }}</small>
            <small v-if="editingTrack?.audio_original_name">{{ t('musicAdmin.track.current', { name: editingTrack.audio_original_name }) }}</small>
          </label>
          <div v-if="editor.id" class="lyrics-sync-box wide">
            <div>
              <strong>{{ t('musicAdmin.track.lyrics') }}</strong>
              <small>{{ editingTrack ? lyricsStatusLabel(editingTrack) : t('musicAdmin.track.notSynced') }}</small>
            </div>
            <button type="button" :disabled="syncingLyricsID === editor.id" @click="editingTrack && syncLyrics(editingTrack)">
              {{ syncingLyricsID === editor.id ? t('musicAdmin.track.syncing') : t('musicAdmin.track.syncLrclib') }}
            </button>
          </div>
          <div class="wide section-label">{{ t('musicAdmin.track.officialVideo') }}</div>
          <div v-if="selectedOfficialVideo" class="video-selection wide">
            <img v-if="selectedOfficialVideo.thumbnail_url" :src="resolveMediaUrl(selectedOfficialVideo.thumbnail_url)" alt="">
            <div v-else class="video-selection-empty" />
            <div>
              <strong>{{ selectedOfficialVideo.title }}</strong>
              <small>{{ selectedOfficialVideo.channel?.name || t('musicAdmin.track.giltubeVideo') }}</small>
            </div>
            <button type="button" @click="clearSelectedOfficialVideo">{{ t('musicAdmin.track.remove') }}</button>
          </div>
          <div class="wide">
            <label><span>{{ selectedOfficialVideo ? t('musicAdmin.track.chooseDifferentVideo') : t('musicAdmin.track.chooseVideo') }}</span><input v-model="videoSearch" :placeholder="t('musicAdmin.track.searchVideos')" @input="handleVideoSearchInput"></label>
            <div v-if="videoPickerLoading" class="mt-3 text-sm text-zinc-400">{{ t('musicAdmin.track.loadingVideos') }}</div>
            <div v-else-if="videoPickerResults.length" class="video-picker-results">
              <button v-for="item in videoPickerResults" :key="item.id" type="button" @click="selectOfficialVideo(item)">
                <img v-if="item.thumbnail_url" :src="resolveMediaUrl(item.thumbnail_url)" alt="">
                <div v-else class="video-result-empty" />
                <span><strong>{{ item.title }}</strong><small>{{ item.channel?.name || '' }}</small></span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
          <span :style="{ width: `${uploadProgress}%` }" />
        </div>
        <p v-if="editorError" class="editor-error">{{ editorError }}</p>
        <footer>
          <button type="button" @click="closeEditor">{{ t('common.cancel') }}</button>
          <button type="submit" class="primary-action" :disabled="saving">{{ saving ? t('common.saving') : t('common.save') }}</button>
        </footer>
        </form>
      </div>

      <div v-if="quickUploadOpen" class="editor-backdrop" @click.self="closeQuickUpload">
        <form class="editor-panel quick-upload-panel" @submit.prevent="submitQuickUpload">
        <header>
          <div>
            <p>{{ t('musicAdmin.track.quickUpload') }}</p>
            <h2>{{ quickStepTitle }}</h2>
          </div>
          <button type="button" :aria-label="t('musicAdmin.quick.close')" :title="t('common.close')" @click="closeQuickUpload">×</button>
        </header>

        <div v-if="quickStep === 'files'" class="quick-step">
          <label
            class="quick-drop-zone"
            :class="{ over: quickDragOver }"
            @dragover.prevent="quickDragOver = true"
            @dragleave.prevent="quickDragOver = false"
            @drop.prevent="dropQuickAudio"
          >
            <input type="file" multiple accept="audio/*,.mp3,.m4a,.aac,.flac,.wav,.ogg,.opus" @change="pickQuickAudio">
            <strong>{{ t('musicAdmin.quick.drop') }}</strong>
            <span>{{ t('musicAdmin.quick.dropHelp') }}</span>
          </label>

          <ol v-if="quickTracks.length" class="quick-file-list">
            <li v-for="track in quickTracks" :key="track.key">
              <span>{{ track.trackNumber }}</span>
              <div>
                <strong>{{ track.title }}</strong>
                <small>{{ track.file.name }}</small>
              </div>
              <small>{{ track.tags.album || track.tags.artist ? t('musicAdmin.quick.tagsFound') : t('musicAdmin.quick.filenameFallback') }}</small>
            </li>
          </ol>
        </div>

        <div v-else-if="quickStep === 'details'" class="editor-fields quick-details">
          <label v-if="quickTagChoices.length > 1" class="wide">
            <span>{{ t('musicAdmin.quick.useTags') }}</span>
            <select v-model="quickTagSourceKey" @change="applyQuickTagSource">
              <option v-for="choice in quickTagChoices" :key="choice.key" :value="choice.key">{{ choice.label }}</option>
            </select>
          </label>
          <label>
            <span>{{ t('music.common.artist') }}</span>
            <input v-model="quickForm.artist" required>
          </label>
          <label>
            <span>{{ t('musicAdmin.quick.releaseTitle') }}</span>
            <input v-model="quickForm.title" required>
          </label>
          <label>
            <span>{{ t('musicAdmin.release.typeLabel') }}</span>
            <select v-model="quickForm.release_type"><option value="single">{{ t('musicAdmin.release.single') }}</option><option value="ep">{{ t('musicAdmin.release.ep') }}</option><option value="album">{{ t('musicAdmin.release.album') }}</option></select>
          </label>
          <label><span>{{ t('musicAdmin.release.date') }}</span><input v-model="quickForm.release_date" type="date"></label>
          <label class="wide"><span>{{ t('musicAdmin.release.label') }}</span><input v-model="quickForm.label"></label>
          <label class="wide"><span>{{ t('musicAdmin.release.copyright') }}</span><input v-model="quickForm.copyright_text" placeholder="© 2026 Rights holder"></label>
          <label class="wide"><span>{{ t('musicAdmin.release.phonogram') }}</span><input v-model="quickForm.phonogram_text" placeholder="℗ 2026 Rights holder"></label>
          <label class="wide"><span>{{ t('musicAdmin.release.territories') }}</span><input v-model="quickForm.territories"></label>
          <div v-if="quickCoverPreview" class="quick-cover-preview wide">
            <img :src="quickCoverPreview" alt="">
            <div><strong>{{ t('musicAdmin.quick.embeddedCover') }}</strong><small>{{ t('musicAdmin.quick.embeddedCoverHelp') }}</small></div>
          </div>
          <label class="check wide"><input v-model="quickForm.rights_confirmed" type="checkbox"><span>{{ t('musicAdmin.release.rightsConfirm') }}</span></label>
        </div>

        <div v-else class="quick-step">
          <div class="quick-review-heading">
            <div>
              <strong>{{ quickForm.title }}</strong>
              <span>{{ quickForm.artist }} · {{ quickTracks.length }} {{ t(quickTracks.length === 1 ? 'music.common.track' : 'music.common.tracks') }}</span>
            </div>
            <span v-if="quickImporting">{{ quickImportProgress }}%</span>
          </div>
          <ol class="bulk-track-list quick-review-list">
            <li v-for="(item, index) in quickTracks" :key="item.key" :class="item.status">
              <input v-model.number="item.discNumber" type="number" min="1" :disabled="quickImporting" :aria-label="t('musicAdmin.track.disc')">
              <input v-model.number="item.trackNumber" type="number" min="1" :disabled="quickImporting" :aria-label="t('musicAdmin.track.number')">
              <div>
                <input v-model="item.title" :disabled="quickImporting || item.status === 'done'" required :aria-label="t('musicAdmin.track.title')">
                <small>{{ item.file.name }}</small>
                <small v-if="item.error" class="text-red-300">{{ item.error }}</small>
              </div>
              <span class="bulk-status">{{ bulkStatusLabel(item) }}</span>
              <div class="bulk-actions">
                <button type="button" :title="t('music.player.moveUp')" :aria-label="t('music.player.moveTrackUp')" :disabled="quickImporting || index === 0" @click="moveQuickTrack(index, -1)">↑</button>
                <button type="button" :title="t('music.player.moveDown')" :aria-label="t('music.player.moveTrackDown')" :disabled="quickImporting || index === quickTracks.length - 1" @click="moveQuickTrack(index, 1)">↓</button>
              </div>
            </li>
          </ol>
        </div>

        <div v-if="quickImportProgress > 0" class="upload-progress">
          <span :style="{ width: `${quickImportProgress}%` }" />
        </div>
        <p v-if="quickUploadError" class="editor-error">{{ quickUploadError }}</p>
        <footer>
          <button type="button" :disabled="quickImporting" @click="quickStep === 'files' ? closeQuickUpload() : previousQuickStep()">{{ t('musicAdmin.quick.back') }}</button>
          <button type="submit" class="primary-action" :disabled="quickImporting || !canAdvanceQuickUpload">
            {{ quickPrimaryLabel }}
          </button>
        </footer>
        </form>
      </div>

      <div v-if="bulkImportOpen" class="editor-backdrop" @click.self="closeBulkImport">
        <form class="editor-panel bulk-import-panel" @submit.prevent="importTracks">
        <header>
          <div>
            <p>{{ t('musicAdmin.tracks') }}</p>
            <h2>{{ t('musicAdmin.bulk.title') }}</h2>
          </div>
          <button type="button" :aria-label="t('musicAdmin.bulk.close')" :title="t('common.close')" @click="closeBulkImport">×</button>
        </header>

        <div class="editor-fields">
          <label class="wide">
            <span>{{ t('musicAdmin.release.release') }}</span>
            <select v-model="bulkReleaseID" required :disabled="bulkReleaseLocked" @change="resetBulkPositions">
              <option value="" disabled>{{ t('musicAdmin.track.selectRelease') }}</option>
              <option v-for="release in releases" :key="release.id" :value="release.id">{{ release.artist_name }} · {{ release.title }}</option>
            </select>
          </label>
          <label><span>{{ t('musicAdmin.track.disc') }}</span><input v-model.number="bulkDiscNumber" type="number" min="1" required :disabled="bulkReleaseLocked" @change="resetBulkPositions"></label>
          <label><span>{{ t('musicAdmin.track.language') }} <small>{{ t('musicAdmin.editor.optional') }}</small></span><input v-model="bulkLanguage" :placeholder="t('videoEditor.languagePlaceholder')"></label>
          <label class="check"><input v-model="bulkExplicit" type="checkbox"><span>{{ t('musicAdmin.bulk.markExplicit') }}</span></label>
          <label class="wide"><span>{{ t('musicAdmin.bulk.audioFiles') }}</span><input type="file" multiple accept="audio/*,.mp3,.m4a,.aac,.flac,.wav,.ogg,.opus" @change="pickBulkAudio"></label>
        </div>

        <ol v-if="bulkTracks.length" class="bulk-track-list">
          <li v-for="(item, index) in bulkTracks" :key="item.key" :class="item.status">
            <span class="bulk-position">{{ item.trackNumber }}</span>
            <div>
              <input v-model="item.title" :disabled="bulkImporting || item.status === 'done'" required :aria-label="t('musicAdmin.track.title')">
              <small>{{ item.file.name }}</small>
              <small v-if="item.error" class="text-red-300">{{ item.error }}</small>
            </div>
            <span class="bulk-status">{{ bulkStatusLabel(item) }}</span>
            <div class="bulk-actions">
              <button type="button" :title="t('music.player.moveUp')" :aria-label="t('music.player.moveTrackUp')" :disabled="bulkReleaseLocked || index === 0" @click="moveBulkTrack(index, -1)">↑</button>
              <button type="button" :title="t('music.player.moveDown')" :aria-label="t('music.player.moveTrackDown')" :disabled="bulkReleaseLocked || index === bulkTracks.length - 1" @click="moveBulkTrack(index, 1)">↓</button>
              <button type="button" :title="t('musicAdmin.track.remove')" :aria-label="t('music.player.removeTrackQueue')" :disabled="bulkReleaseLocked" @click="removeBulkTrack(index)">×</button>
            </div>
          </li>
        </ol>

        <div v-if="bulkImportProgress > 0" class="upload-progress">
          <span :style="{ width: `${bulkImportProgress}%` }" />
        </div>
        <p v-if="bulkImportError" class="editor-error">{{ bulkImportError }}</p>
        <footer>
          <button type="button" :disabled="bulkImporting" @click="closeBulkImport">{{ t('common.cancel') }}</button>
          <button type="submit" class="primary-action" :disabled="bulkImporting || !bulkTracks.length || !bulkReleaseID">
            {{ bulkImporting ? t('musicAdmin.bulk.importing', { current: bulkImportCurrent, total: bulkTracks.length }) : t('musicAdmin.bulk.import', { count: bulkTracks.length }) }}
          </button>
        </footer>
        </form>
      </div>
    </Teleport>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useLocalePath } from '#i18n'
import {
  createMusicArtist,
  createMusicRelease,
  createMusicTrack,
  clearMusicTrackVideo,
  deleteMusicArtist,
  deleteMusicRelease,
  deleteMusicTrack,
  getAdminMusicOverview,
  listAdminMusicArtists,
  listAdminMusicReleases,
  listAdminMusicTracks,
  listMusicAdminChannels,
  publishMusicRelease,
  setMusicTrackVideo,
  syncMusicTrackLyrics,
  unpublishMusicRelease,
  updateMusicArtist,
  updateMusicRelease,
  updateMusicTrack,
  uploadMusicArtistAvatar,
  uploadMusicReleaseCover,
  uploadMusicTrackAudio,
  useMusicTrackArtwork,
  type MusicArtist,
  type MusicArtistInput,
  type MusicAdminChannel,
  type MusicRelease,
  type MusicReleaseInput,
  type MusicTrack,
  type MusicTrackInput,
} from '~/app/service/music'
import { getVideos } from '~/app/service/videos'
import { searchWatchPartyVideos } from '~/app/service/watchParties'
import { imageVariantUrl, resolveMediaUrl } from '~/app/utils/media'

type EditorKind = 'artist' | 'release' | 'track'
type CatalogTab = 'artists' | 'releases' | 'tracks'
type BulkTrackStatus = 'pending' | 'uploading' | 'done' | 'error'
type BulkTrack = {
  key: string
  file: File
  title: string
  trackNumber: number
  trackID: string
  status: BulkTrackStatus
  error: string
}
type ParsedAudioTags = {
  title: string
  artist: string
  album: string
  date: string
  trackNumber: number
  discNumber: number
  cover: File | null
}
type QuickTrack = BulkTrack & {
  discNumber: number
  tags: ParsedAudioTags
}
type QuickUploadStep = 'files' | 'details' | 'review'

const localePath = useLocalePath()
const { t, locale } = useI18n()
const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const accessError = ref('')
const actionError = ref('')
const editorError = ref('')
const notice = ref('')
const tab = ref<CatalogTab>('artists')
const artists = ref<MusicArtist[]>([])
const releases = ref<MusicRelease[]>([])
const tracks = ref<MusicTrack[]>([])
const channels = ref<MusicAdminChannel[]>([])
const overview = reactive({ artists: 0, releases: 0, tracks: 0, published: 0, blocked: 0 })
const editor = ref<{ kind: EditorKind; id: string } | null>(null)
const selectedArtistAvatar = ref<File | null>(null)
const selectedCover = ref<File | null>(null)
const coverInputKey = ref(0)
const selectedAudio = ref<File | null>(null)
const selectedOfficialVideo = ref<any | null>(null)
const videoSearch = ref('')
const videoPickerResults = ref<any[]>([])
const videoPickerLoading = ref(false)
let videoSearchTimer: ReturnType<typeof setTimeout> | null = null
const uploadProgress = ref(0)
const extractingArtwork = ref(false)
const syncingLyricsID = ref('')
const syncingReleaseLyricsID = ref('')
const embeddedArtworkTrackID = ref('')
const editingRelease = computed(() => editor.value?.kind === 'release'
  ? releases.value.find(item => item.id === editor.value?.id)
  : undefined)
const releaseArtworkTracks = computed(() => tracks.value
  .filter(track => track.release_id === editor.value?.id && Boolean(track.audio_url))
  .sort((left, right) => left.disc_number - right.disc_number || left.track_number - right.track_number))
const editingTrack = computed(() => editor.value?.kind === 'track' ? tracks.value.find(item => item.id === editor.value?.id) : undefined)
const bulkImportOpen = ref(false)
const bulkImporting = ref(false)
const bulkImportProgress = ref(0)
const bulkImportCurrent = ref(0)
const bulkImportError = ref('')
const bulkReleaseID = ref('')
const bulkDiscNumber = ref(1)
const bulkLanguage = ref('')
const bulkExplicit = ref(false)
const bulkTracks = ref<BulkTrack[]>([])
const bulkReleaseLocked = computed(() => bulkImporting.value || bulkTracks.value.some(item => Boolean(item.trackID)))
const quickUploadOpen = ref(false)
const quickStep = ref<QuickUploadStep>('files')
const quickDragOver = ref(false)
const quickTracks = ref<QuickTrack[]>([])
const quickTagSourceKey = ref('')
const quickCover = ref<File | null>(null)
const quickCoverPreview = ref('')
const quickUploadError = ref('')
const quickImporting = ref(false)
const quickImportProgress = ref(0)

const artistForm = reactive<MusicArtistInput>({ name: '', bio: '', primary_channel_id: '', verified: false })
const releaseForm = reactive<MusicReleaseInput>({
  artist_id: '', title: '', release_type: 'single', release_date: '', label: '',
  copyright_text: '', phonogram_text: '', territories: 'Worldwide', rights_confirmed: false,
})
const trackForm = reactive<MusicTrackInput>({
  release_id: '', title: '', disc_number: 1, track_number: 1, duration_seconds: 0,
  isrc: '', explicit: false, language: '',
})
const quickForm = reactive<MusicReleaseInput & { artist: string }>({
  artist: '', artist_id: '', title: '', release_type: 'album', release_date: '', label: '',
  copyright_text: '', phonogram_text: '', territories: 'Worldwide', rights_confirmed: false,
})

const tabs = computed(() => [
  { id: 'artists' as CatalogTab, label: t('musicAdmin.artists'), count: artists.value.length },
  { id: 'releases' as CatalogTab, label: t('musicAdmin.releases'), count: releases.value.length },
  { id: 'tracks' as CatalogTab, label: t('musicAdmin.tracks'), count: tracks.value.length },
])
const trackGroups = computed(() => releases.value
  .map(release => {
    const releaseTracks = tracks.value
      .filter(track => track.release_id === release.id)
      .sort((left, right) =>
        left.disc_number - right.disc_number
        || left.track_number - right.track_number
        || left.title.localeCompare(right.title),
      )
    return {
      release,
      tracks: releaseTracks,
      readyCount: releaseTracks.filter(track => trackPublishProblems(track).length === 0).length,
    }
  })
  .filter(group => group.tracks.length > 0))

const availableArtistChannels = computed(() => channels.value.filter(channel =>
  !artists.value.some(artist => artist.primary_channel_id === channel.id && artist.id !== editor.value?.id),
))
const quickStepTitle = computed(() => {
  if (quickStep.value === 'details') return t('musicAdmin.quick.albumDetails')
  if (quickStep.value === 'review') return t('musicAdmin.quick.reviewTracks')
  return t('musicAdmin.quick.selectFiles')
})
const quickTagChoices = computed(() => quickTracks.value
  .filter(track => track.tags.artist || track.tags.album || track.tags.date || track.tags.cover)
  .map(track => ({
    key: track.key,
    label: `${track.title} ${track.tags.album || track.tags.artist ? `(${[track.tags.artist, track.tags.album].filter(Boolean).join(' · ')})` : ''}`.trim(),
  })))
const canAdvanceQuickUpload = computed(() => {
  if (quickStep.value === 'files') return quickTracks.value.length > 0
  if (quickStep.value === 'details') return Boolean(quickForm.artist.trim() && quickForm.title.trim())
  return quickTracks.value.length > 0 && quickTracks.value.every(track => track.title.trim())
})
const quickPrimaryLabel = computed(() => {
  if (quickImporting.value) return t('musicAdmin.quick.uploading', { progress: quickImportProgress.value })
  if (quickStep.value === 'files') return t('musicAdmin.quick.continue')
  if (quickStep.value === 'details') return t('musicAdmin.quick.reviewTracks')
  return t('musicAdmin.quick.createUpload', { count: quickTracks.value.length })
})

const messageFrom = (error: any) => {
  const missing = error?.response?.data?.missing
  if (Array.isArray(missing) && missing.length) return t('musicAdmin.messages.missing', { fields: missing.join(', ') })
  return error?.response?.data?.error || error?.message || String(error)
}

const refresh = async () => {
  const [summary, artistItems, releaseItems, trackItems, channelItems] = await Promise.all([
    getAdminMusicOverview(),
    listAdminMusicArtists(),
    listAdminMusicReleases(),
    listAdminMusicTracks(),
    listMusicAdminChannels(),
  ])
  Object.assign(overview, summary)
  artists.value = artistItems
  releases.value = releaseItems
  tracks.value = trackItems
  channels.value = channelItems
}

onMounted(async () => {
  if (!localStorage.getItem('user_id')) {
    router.push(localePath('/login'))
    return
  }
  try {
    await refresh()
  } catch (error: any) {
    accessError.value = error?.response?.status === 403 ? t('musicAdmin.messages.adminRequired') : messageFrom(error)
  } finally {
    loading.value = false
  }
})

const resetMessages = () => {
  actionError.value = ''
  editorError.value = ''
  notice.value = ''
  uploadProgress.value = 0
}

const openArtist = (artist?: MusicArtist) => {
  resetMessages()
  selectedArtistAvatar.value = null
  Object.assign(artistForm, artist
    ? { name: artist.name, bio: artist.bio, primary_channel_id: artist.primary_channel_id, verified: artist.verified }
    : { name: '', bio: '', primary_channel_id: '', verified: false })
  editor.value = { kind: 'artist', id: artist?.id || '' }
}

const openRelease = (release?: MusicRelease) => {
  resetMessages()
  selectedCover.value = null
  coverInputKey.value += 1
  embeddedArtworkTrackID.value = tracks.value
    .filter(track => track.release_id === release?.id && Boolean(track.audio_url))
    .sort((left, right) => left.disc_number - right.disc_number || left.track_number - right.track_number)[0]?.id || ''
  Object.assign(releaseForm, release
    ? {
        artist_id: release.artist_id, title: release.title, release_type: release.release_type,
        release_date: release.release_date?.slice(0, 10) || '', label: release.label,
        copyright_text: release.copyright_text, phonogram_text: release.phonogram_text,
        territories: release.territories || 'Worldwide', rights_confirmed: release.rights_confirmed,
      }
    : {
        artist_id: artists.value[0]?.id || '', title: '', release_type: 'single',
        release_date: '', label: '', copyright_text: '', phonogram_text: '',
        territories: 'Worldwide', rights_confirmed: false,
      })
  editor.value = { kind: 'release', id: release?.id || '' }
}

const openTrack = (track?: MusicTrack) => {
  resetMessages()
  selectedAudio.value = null
  videoSearch.value = ''
  videoPickerResults.value = []
  selectedOfficialVideo.value = track?.official_video_id
    ? {
        id: track.official_video_id,
        title: track.official_video_title,
        thumbnail_url: track.official_video_thumbnail,
      }
    : null
  Object.assign(trackForm, track
    ? {
        release_id: track.release_id, title: track.title, disc_number: track.disc_number,
        track_number: track.track_number, duration_seconds: track.duration_seconds,
        isrc: track.isrc, explicit: track.explicit, language: track.language,
      }
    : {
        release_id: releases.value[0]?.id || '', title: '', disc_number: 1,
        track_number: nextTrackNumber(releases.value[0]?.id || ''), duration_seconds: 0,
        isrc: '', explicit: false, language: '',
      })
  editor.value = { kind: 'track', id: track?.id || '' }
  loadVideoPicker()
}

const nextTrackNumber = (releaseID: string, discNumber = 1) => Math.max(
  0,
  ...tracks.value
    .filter(track => track.release_id === releaseID && track.disc_number === discNumber)
    .map(track => track.track_number),
) + 1

const closeEditor = () => {
  if (saving.value) return
  editor.value = null
}

const pickCover = (event: Event) => {
  selectedCover.value = (event.target as HTMLInputElement).files?.[0] || null
}

const applyEmbeddedArtwork = async () => {
  const releaseID = editor.value?.kind === 'release' ? editor.value.id : ''
  if (!releaseID || !embeddedArtworkTrackID.value || extractingArtwork.value) return
  extractingArtwork.value = true
  editorError.value = ''
  try {
    const result = await useMusicTrackArtwork(releaseID, embeddedArtworkTrackID.value)
    const release = releases.value.find(item => item.id === releaseID)
    if (release) release.cover_url = result.cover_url
    selectedCover.value = null
    coverInputKey.value += 1
  } catch (error: any) {
    editorError.value = messageFrom(error)
  } finally {
    extractingArtwork.value = false
  }
}

const pickArtistAvatar = (event: Event) => {
  selectedArtistAvatar.value = (event.target as HTMLInputElement).files?.[0] || null
}

const pickAudio = (event: Event) => {
  selectedAudio.value = (event.target as HTMLInputElement).files?.[0] || null
}

const emptyTags = (): ParsedAudioTags => ({
  title: '', artist: '', album: '', date: '', trackNumber: 0, discNumber: 1, cover: null,
})

const cleanTagText = (value: string) => value.replace(/\u0000/g, '').trim()
const parseTrackNumber = (value: string) => Number(cleanTagText(value).split('/')[0]) || 0
const parseTagDate = (value: string) => {
  const match = cleanTagText(value).match(/\d{4}(?:-\d{2}(?:-\d{2})?)?/)
  return match?.[0] || ''
}

const decodeID3Text = (data: Uint8Array) => {
  const encoding = data[0] || 0
  const body = data.slice(1)
  const decoder = encoding === 1 || encoding === 2
    ? new TextDecoder('utf-16')
    : new TextDecoder('utf-8')
  return cleanTagText(decoder.decode(body))
}

const syncSafeInt = (bytes: Uint8Array) =>
  ((bytes[0] || 0) << 21) | ((bytes[1] || 0) << 14) | ((bytes[2] || 0) << 7) | (bytes[3] || 0)

const uint32BE = (bytes: Uint8Array) =>
  ((bytes[0] || 0) << 24) | ((bytes[1] || 0) << 16) | ((bytes[2] || 0) << 8) | (bytes[3] || 0)

const uint32LE = (bytes: Uint8Array, offset: number) =>
  (bytes[offset] || 0) | ((bytes[offset + 1] || 0) << 8) | ((bytes[offset + 2] || 0) << 16) | ((bytes[offset + 3] || 0) << 24)

const parseAPIC = (data: Uint8Array, fileName: string) => {
  let offset = 1
  while (offset < data.length && data[offset] !== 0) offset += 1
  const mime = new TextDecoder('latin1').decode(data.slice(1, offset)) || 'image/jpeg'
  offset += 2
  const encoding = data[0] || 0
  const terminatorSize = encoding === 1 || encoding === 2 ? 2 : 1
  while (offset < data.length) {
    if (terminatorSize === 2 && data[offset] === 0 && data[offset + 1] === 0) {
      offset += 2
      break
    }
    if (terminatorSize === 1 && data[offset] === 0) {
      offset += 1
      break
    }
    offset += 1
  }
  const extension = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'
  const blob = new Blob([data.slice(offset)], { type: mime })
  return new File([blob], `${fileName.replace(/\.[^.]+$/, '')}-cover.${extension}`, { type: mime })
}

const parseID3Tags = async (file: File) => {
  const tags = emptyTags()
  const bytes = new Uint8Array(await file.slice(0, Math.min(file.size, 5 * 1024 * 1024)).arrayBuffer())
  if (new TextDecoder('latin1').decode(bytes.slice(0, 3)) !== 'ID3') return tags
  const version = bytes[3] || 3
  const tagSize = Math.min(syncSafeInt(bytes.slice(6, 10)), bytes.length - 10)
  let offset = 10
  const frameMap: Record<string, keyof ParsedAudioTags> = { TIT2: 'title', TPE1: 'artist', TALB: 'album' }
  while (offset + 10 <= tagSize + 10) {
    const id = new TextDecoder('latin1').decode(bytes.slice(offset, offset + 4))
    if (!/^[A-Z0-9]{4}$/.test(id)) break
    const size = version === 4 ? syncSafeInt(bytes.slice(offset + 4, offset + 8)) : uint32BE(bytes.slice(offset + 4, offset + 8))
    if (size <= 0 || offset + 10 + size > bytes.length) break
    const data = bytes.slice(offset + 10, offset + 10 + size)
    if (frameMap[id]) {
      ;(tags[frameMap[id]] as string) = decodeID3Text(data)
    }
    if (id === 'TRCK') tags.trackNumber = parseTrackNumber(decodeID3Text(data))
    if (id === 'TPOS') tags.discNumber = parseTrackNumber(decodeID3Text(data)) || 1
    if (id === 'TYER' || id === 'TDRC') tags.date = parseTagDate(decodeID3Text(data))
    if (id === 'APIC' && !tags.cover) tags.cover = parseAPIC(data, file.name)
    offset += 10 + size
  }
  return tags
}

const parseFLACTags = async (file: File) => {
  const tags = emptyTags()
  const bytes = new Uint8Array(await file.slice(0, Math.min(file.size, 5 * 1024 * 1024)).arrayBuffer())
  if (new TextDecoder('latin1').decode(bytes.slice(0, 4)) !== 'fLaC') return tags
  let offset = 4
  let last = false
  while (!last && offset + 4 <= bytes.length) {
    const header = bytes[offset] || 0
    last = Boolean(header & 0x80)
    const type = header & 0x7f
    const length = ((bytes[offset + 1] || 0) << 16) | ((bytes[offset + 2] || 0) << 8) | (bytes[offset + 3] || 0)
    const blockStart = offset + 4
    const block = bytes.slice(blockStart, blockStart + length)
    if (type === 4 && block.length) {
      let cursor = 0
      const vendorLength = uint32LE(block, cursor)
      cursor += 4 + vendorLength
      const count = uint32LE(block, cursor)
      cursor += 4
      for (let index = 0; index < count && cursor + 4 <= block.length; index += 1) {
        const commentLength = uint32LE(block, cursor)
        cursor += 4
        const comment = new TextDecoder('utf-8').decode(block.slice(cursor, cursor + commentLength))
        cursor += commentLength
        const [rawKey, ...rawValue] = comment.split('=')
        const key = (rawKey || '').toUpperCase()
        const value = rawValue.join('=')
        if (key === 'TITLE') tags.title = cleanTagText(value)
        if (key === 'ARTIST') tags.artist = cleanTagText(value)
        if (key === 'ALBUM') tags.album = cleanTagText(value)
        if (key === 'DATE') tags.date = parseTagDate(value)
        if (key === 'TRACKNUMBER') tags.trackNumber = parseTrackNumber(value)
        if (key === 'DISCNUMBER') tags.discNumber = parseTrackNumber(value) || 1
      }
    }
    if (type === 6 && block.length > 32 && !tags.cover) {
      let cursor = 4
      const mimeLength = uint32BE(block.slice(cursor, cursor + 4))
      cursor += 4
      const mime = new TextDecoder('latin1').decode(block.slice(cursor, cursor + mimeLength)) || 'image/jpeg'
      cursor += mimeLength
      const descriptionLength = uint32BE(block.slice(cursor, cursor + 4))
      cursor += 4 + descriptionLength + 16
      const dataLength = uint32BE(block.slice(cursor, cursor + 4))
      cursor += 4
      const extension = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'
      tags.cover = new File([new Blob([block.slice(cursor, cursor + dataLength)], { type: mime })], `${file.name.replace(/\.[^.]+$/, '')}-cover.${extension}`, { type: mime })
    }
    offset = blockStart + length
  }
  return tags
}

const readAudioTags = async (file: File) => {
  try {
    const extension = file.name.toLowerCase().split('.').pop() || ''
    const tags = extension === 'flac' ? await parseFLACTags(file) : await parseID3Tags(file)
    tags.title ||= inferredTrackTitle(file.name)
    return tags
  } catch {
    return { ...emptyTags(), title: inferredTrackTitle(file.name) }
  }
}

const buildQuickTrack = (file: File, tags: ParsedAudioTags, index: number): QuickTrack => ({
  key: `${file.name}-${file.size}-${file.lastModified}-${index}`,
  file,
  title: tags.title || inferredTrackTitle(file.name),
  trackNumber: tags.trackNumber || index + 1,
  discNumber: tags.discNumber || 1,
  trackID: '',
  status: 'pending',
  error: '',
  tags,
})

const applyQuickTagSource = () => {
  const source = quickTracks.value.find(track => track.key === quickTagSourceKey.value) || quickTracks.value[0]
  if (!source) return
  quickForm.artist = source.tags.artist || quickForm.artist
  quickForm.title = source.tags.album || source.tags.title || quickForm.title
  quickForm.release_date = source.tags.date || quickForm.release_date
  quickCover.value = source.tags.cover || quickCover.value
  if (quickCoverPreview.value) URL.revokeObjectURL(quickCoverPreview.value)
  quickCoverPreview.value = quickCover.value ? URL.createObjectURL(quickCover.value) : ''
}

const setQuickFiles = async (files: File[]) => {
  if (!files.length) return
  quickUploadError.value = ''
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
  const sorted = [...files].sort((a, b) => collator.compare(a.name, b.name))
  const parsed = await Promise.all(sorted.map(readAudioTags))
  quickTracks.value = sorted.map((file, index) => buildQuickTrack(file, parsed[index] || emptyTags(), index))
  quickTracks.value.sort((left, right) =>
    left.discNumber - right.discNumber
    || left.trackNumber - right.trackNumber
    || collator.compare(left.file.name, right.file.name),
  )
  quickTracks.value.forEach((track, index) => {
    if (!track.trackNumber) track.trackNumber = index + 1
  })
  quickTagSourceKey.value = quickTagChoices.value[0]?.key || quickTracks.value[0]?.key || ''
  applyQuickTagSource()
}

const openQuickUpload = () => {
  resetMessages()
  quickStep.value = 'files'
  quickUploadError.value = ''
  quickImportProgress.value = 0
  quickImporting.value = false
  quickTracks.value = []
  quickTagSourceKey.value = ''
  quickCover.value = null
  if (quickCoverPreview.value) URL.revokeObjectURL(quickCoverPreview.value)
  quickCoverPreview.value = ''
  Object.assign(quickForm, {
    artist: '', artist_id: '', title: '', release_type: 'album', release_date: '',
    label: '', copyright_text: '', phonogram_text: '', territories: 'Worldwide', rights_confirmed: false,
  })
  quickUploadOpen.value = true
}

const closeQuickUpload = () => {
  if (quickImporting.value) return
  quickUploadOpen.value = false
}

const pickQuickAudio = async (event: Event) => {
  const input = event.target as HTMLInputElement
  await setQuickFiles(Array.from(input.files || []))
  input.value = ''
}

const dropQuickAudio = async (event: DragEvent) => {
  quickDragOver.value = false
  await setQuickFiles(Array.from(event.dataTransfer?.files || []).filter(file => file.type.startsWith('audio/') || /\.(mp3|m4a|aac|flac|wav|ogg|opus)$/i.test(file.name)))
}

const previousQuickStep = () => {
  quickUploadError.value = ''
  quickStep.value = quickStep.value === 'review' ? 'details' : 'files'
}

const moveQuickTrack = (index: number, direction: -1 | 1) => {
  const target = index + direction
  if (target < 0 || target >= quickTracks.value.length) return
  const [item] = quickTracks.value.splice(index, 1)
  if (!item) return
  quickTracks.value.splice(target, 0, item)
  quickTracks.value.forEach((track, itemIndex) => { track.trackNumber = itemIndex + 1 })
}

const submitQuickUpload = async () => {
  quickUploadError.value = ''
  if (quickStep.value === 'files') {
    quickStep.value = 'details'
    return
  }
  if (quickStep.value === 'details') {
    quickStep.value = 'review'
    return
  }
  await runQuickImport()
}

const openBulkImport = () => {
  resetMessages()
  bulkReleaseID.value = releases.value[0]?.id || ''
  bulkDiscNumber.value = 1
  bulkLanguage.value = ''
  bulkExplicit.value = false
  bulkTracks.value = []
  bulkImportProgress.value = 0
  bulkImportCurrent.value = 0
  bulkImportError.value = ''
  bulkImportOpen.value = true
}

const closeBulkImport = () => {
  if (bulkImporting.value) return
  bulkImportOpen.value = false
}

const inferredTrackTitle = (fileName: string) => fileName
  .replace(/\.[^.]+$/, '')
  .replace(/^\s*(?:\d+[\s._-]+)+/, '')
  .replace(/[_]+/g, ' ')
  .trim() || fileName.replace(/\.[^.]+$/, '')

const updateBulkTrackNumbers = () => {
  const start = nextTrackNumber(bulkReleaseID.value, bulkDiscNumber.value)
  bulkTracks.value.forEach((item, index) => {
    if (!item.trackID) item.trackNumber = start + index
  })
}

const resetBulkPositions = () => {
  updateBulkTrackNumbers()
}

const pickBulkAudio = (event: Event) => {
  const input = event.target as HTMLInputElement
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
  const files = Array.from(input.files || []).sort((a, b) => collator.compare(a.name, b.name))
  const start = nextTrackNumber(bulkReleaseID.value, bulkDiscNumber.value)
  bulkTracks.value = files.map((file, index) => ({
    key: `${file.name}-${file.size}-${file.lastModified}-${index}`,
    file,
    title: inferredTrackTitle(file.name),
    trackNumber: start + index,
    trackID: '',
    status: 'pending',
    error: '',
  }))
  bulkImportProgress.value = 0
  bulkImportError.value = ''
  input.value = ''
}

const moveBulkTrack = (index: number, direction: -1 | 1) => {
  const target = index + direction
  if (target < 0 || target >= bulkTracks.value.length) return
  const [item] = bulkTracks.value.splice(index, 1)
  if (!item) return
  bulkTracks.value.splice(target, 0, item)
  updateBulkTrackNumbers()
}

const removeBulkTrack = (index: number) => {
  bulkTracks.value.splice(index, 1)
  updateBulkTrackNumbers()
}

const bulkStatusLabel = (item: BulkTrack) => {
  if (item.status === 'uploading') return t('musicAdmin.bulk.uploading')
  if (item.status === 'done') return t('musicAdmin.bulk.imported')
  if (item.status === 'error') return t('musicAdmin.bulk.retry')
  return ''
}

const importTracks = async () => {
  if (!bulkReleaseID.value || !bulkTracks.value.length || bulkImporting.value) return
  bulkImporting.value = true
  bulkImportError.value = ''
  let failed = 0
  try {
    for (let index = 0; index < bulkTracks.value.length; index += 1) {
      const item = bulkTracks.value[index]
      if (!item || item.status === 'done') continue
      bulkImportCurrent.value = index + 1
      item.status = 'uploading'
      item.error = ''
      try {
        if (!item.trackID) {
          const track = await createMusicTrack({
            release_id: bulkReleaseID.value,
            title: item.title.trim(),
            disc_number: bulkDiscNumber.value,
            track_number: item.trackNumber,
            duration_seconds: 0,
            isrc: '',
            explicit: bulkExplicit.value,
            language: bulkLanguage.value.trim(),
          })
          item.trackID = track.id
        }
        await uploadMusicTrackAudio(item.trackID, item.file, value => {
          bulkImportProgress.value = Math.round(((index + (value / 100)) / bulkTracks.value.length) * 100)
        })
        item.status = 'done'
        bulkImportProgress.value = Math.round(((index + 1) / bulkTracks.value.length) * 100)
      } catch (error: any) {
        item.status = 'error'
        item.error = messageFrom(error)
        failed += 1
      }
    }
    await refresh()
  } finally {
    bulkImporting.value = false
  }
  if (failed > 0) {
    bulkImportError.value = t('musicAdmin.messages.importNeedsAttention', { count: failed })
    return
  }
  const imported = bulkTracks.value.length
  bulkImportOpen.value = false
  notice.value = t('musicAdmin.messages.imported', { count: imported })
}

const runQuickImport = async () => {
  if (!quickTracks.value.length || quickImporting.value) return
  quickImporting.value = true
  quickImportProgress.value = 0
  let failed = 0
  let coverApplied = false
  try {
    const artistName = quickForm.artist.trim()
    let artist = artists.value.find(item => item.name.toLowerCase() === artistName.toLowerCase())
    if (!artist) {
      try {
        artist = await createMusicArtist({ name: artistName, bio: '', primary_channel_id: '', verified: false })
      } catch (error: any) {
        const existing = artists.value.find(item => item.name.toLowerCase() === artistName.toLowerCase())
        if (!existing) throw error
        artist = existing
      }
    }
    const release = await createMusicRelease({
      artist_id: artist.id,
      title: quickForm.title.trim(),
      release_type: quickForm.release_type,
      release_date: quickForm.release_date,
      label: quickForm.label,
      copyright_text: quickForm.copyright_text,
      phonogram_text: quickForm.phonogram_text,
      territories: quickForm.territories || 'Worldwide',
      rights_confirmed: quickForm.rights_confirmed,
    })
    if (quickCover.value) {
      await uploadMusicReleaseCover(release.id, quickCover.value)
      coverApplied = true
    }

    for (let index = 0; index < quickTracks.value.length; index += 1) {
      const item = quickTracks.value[index]
      if (!item || item.status === 'done') continue
      item.status = 'uploading'
      item.error = ''
      try {
        const track = await createMusicTrack({
          release_id: release.id,
          title: item.title.trim(),
          disc_number: item.discNumber || 1,
          track_number: item.trackNumber || index + 1,
          duration_seconds: 0,
          isrc: '',
          explicit: false,
          language: '',
        })
        item.trackID = track.id
        await uploadMusicTrackAudio(track.id, item.file, value => {
          quickImportProgress.value = Math.round(((index + (value / 100)) / quickTracks.value.length) * 100)
        })
        if (!coverApplied) {
          try {
            await useMusicTrackArtwork(release.id, track.id)
            coverApplied = true
          } catch {
            // Embedded artwork is optional; keep importing if extraction is unavailable.
          }
        }
        item.status = 'done'
        quickImportProgress.value = Math.round(((index + 1) / quickTracks.value.length) * 100)
      } catch (error: any) {
        item.status = 'error'
        item.error = messageFrom(error)
        failed += 1
      }
    }
    await refresh()
  } catch (error: any) {
    quickUploadError.value = messageFrom(error)
  } finally {
    quickImporting.value = false
  }
  if (quickUploadError.value) return
  if (failed > 0) {
    quickUploadError.value = t('musicAdmin.messages.importNeedsAttention', { count: failed })
    return
  }
  const imported = quickTracks.value.length
  quickUploadOpen.value = false
  tab.value = 'tracks'
  notice.value = t('musicAdmin.messages.created', { title: quickForm.title, count: imported })
}

const loadVideoPicker = async () => {
  videoPickerLoading.value = true
  try {
    videoPickerResults.value = await getVideos({ limit: 12, offset: 0 })
  } catch {
    videoPickerResults.value = []
  } finally {
    videoPickerLoading.value = false
  }
}

const searchVideoPicker = async () => {
  const query = videoSearch.value.trim()
  if (!query) {
    await loadVideoPicker()
    return
  }
  videoPickerLoading.value = true
  try {
    const data = await searchWatchPartyVideos(query)
    videoPickerResults.value = (data.results || []).slice(0, 12)
  } catch {
    videoPickerResults.value = []
  } finally {
    videoPickerLoading.value = false
  }
}

const handleVideoSearchInput = () => {
  if (videoSearchTimer) clearTimeout(videoSearchTimer)
  videoSearchTimer = setTimeout(searchVideoPicker, 250)
}

const selectOfficialVideo = (video: any) => {
  selectedOfficialVideo.value = video
  videoSearch.value = ''
  videoPickerResults.value = []
}

const clearSelectedOfficialVideo = () => {
  selectedOfficialVideo.value = null
  videoSearch.value = ''
  loadVideoPicker()
}

const saveEditor = async () => {
  if (!editor.value) return
  saving.value = true
  editorError.value = ''
  uploadProgress.value = 0
  try {
    if (editor.value.kind === 'artist') {
      const saved = editor.value.id
        ? await updateMusicArtist(editor.value.id, { ...artistForm })
        : await createMusicArtist({ ...artistForm })
      if (selectedArtistAvatar.value) {
        await uploadMusicArtistAvatar(saved.id, selectedArtistAvatar.value, value => { uploadProgress.value = value })
      }
    }
    if (editor.value.kind === 'release') {
      const saved = editor.value.id
        ? await updateMusicRelease(editor.value.id, { ...releaseForm })
        : await createMusicRelease({ ...releaseForm })
      if (selectedCover.value) await uploadMusicReleaseCover(saved.id, selectedCover.value, value => { uploadProgress.value = value })
    }
    if (editor.value.kind === 'track') {
      const previousVideoID = editingTrack.value?.official_video_id || ''
      const saved = editor.value.id
        ? await updateMusicTrack(editor.value.id, { ...trackForm })
        : await createMusicTrack({ ...trackForm })
      if (selectedAudio.value) await uploadMusicTrackAudio(saved.id, selectedAudio.value, value => { uploadProgress.value = value })
      if (selectedOfficialVideo.value?.id) {
        await setMusicTrackVideo(saved.id, selectedOfficialVideo.value.id)
      } else if (previousVideoID) {
        await clearMusicTrackVideo(saved.id)
      }
    }
    const kind = editor.value.kind
    editor.value = null
    await refresh()
    notice.value = t('musicAdmin.messages.saved', { kind: editorKindLabel(kind) })
  } catch (error: any) {
    editorError.value = messageFrom(error)
  } finally {
    saving.value = false
  }
}

const runAction = async (action: () => Promise<any>, success: string) => {
  resetMessages()
  try {
    await action()
    await refresh()
    notice.value = success
  } catch (error: any) {
    actionError.value = messageFrom(error)
  }
}

const setReleasePublished = (release: MusicRelease, publish: boolean) =>
  runAction(
    () => publish ? publishMusicRelease(release.id) : unpublishMusicRelease(release.id),
    t(publish ? 'musicAdmin.messages.published' : 'musicAdmin.messages.unpublished', { title: release.title }),
  )

const removeArtist = (artist: MusicArtist) => {
  if (confirm(t('musicAdmin.messages.deleteArtist', { name: artist.name }))) {
    runAction(() => deleteMusicArtist(artist.id), t('musicAdmin.messages.deleted', { title: artist.name }))
  }
}

const removeRelease = (release: MusicRelease) => {
  if (confirm(t('musicAdmin.messages.deleteRelease', { title: release.title }))) {
    runAction(() => deleteMusicRelease(release.id), t('musicAdmin.messages.deleted', { title: release.title }))
  }
}

const removeTrack = (track: MusicTrack) => {
  if (confirm(t('musicAdmin.messages.deleteTrack', { title: track.title }))) {
    runAction(() => deleteMusicTrack(track.id), t('musicAdmin.messages.deleted', { title: track.title }))
  }
}

const syncLyrics = async (track: MusicTrack) => {
  if (syncingLyricsID.value) return
  resetMessages()
  syncingLyricsID.value = track.id
  try {
    const saved = await syncMusicTrackLyrics(track.id)
    const index = tracks.value.findIndex(item => item.id === track.id)
    if (index >= 0) tracks.value[index] = saved
    notice.value = t(saved.synced_lyrics ? 'musicAdmin.messages.timedLyrics' : 'musicAdmin.messages.plainLyrics', { title: track.title })
  } catch (error: any) {
    actionError.value = messageFrom(error)
    editorError.value = messageFrom(error)
  } finally {
    syncingLyricsID.value = ''
  }
}

const syncReleaseLyrics = async (group: { release: MusicRelease; tracks: MusicTrack[] }) => {
  if (syncingReleaseLyricsID.value) return
  resetMessages()
  syncingReleaseLyricsID.value = group.release.id
  let synced = 0
  let missing = 0
  try {
    for (const track of group.tracks) {
      syncingLyricsID.value = track.id
      try {
        const saved = await syncMusicTrackLyrics(track.id)
        const index = tracks.value.findIndex(item => item.id === track.id)
        if (index >= 0) tracks.value[index] = saved
        synced += 1
      } catch {
        missing += 1
      }
    }
    notice.value = t('musicAdmin.messages.syncSummary', {
      title: group.release.title,
      synced,
      missing: missing ? t('musicAdmin.messages.notFound', { count: missing }) : '',
    })
  } finally {
    syncingLyricsID.value = ''
    syncingReleaseLyricsID.value = ''
  }
}

const releaseRightsReady = (release: MusicRelease) => Boolean(
  release.copyright_text
  && release.phonogram_text
  && release.territories
  && release.rights_confirmed,
)

const audioFormatLabel = (track: MusicTrack) => {
  if (!track.audio_codec) return t('musicAdmin.audio.notGenerated')
  const details = [
    track.audio_codec.toUpperCase(),
    track.audio_sample_rate ? `${Math.round(track.audio_sample_rate / 100) / 10} kHz` : '',
    track.audio_bit_depth ? `${track.audio_bit_depth}-bit` : '',
    track.audio_lossless ? t('musicAdmin.audio.lossless') : '',
  ].filter(Boolean)
  return details.join(' · ')
}
const lyricsStatusLabel = (track: MusicTrack) => {
  if (track.synced_lyrics) return t('musicAdmin.audio.timedLyrics')
  if (track.lyrics) return t('musicAdmin.audio.plainLyrics')
  return t('musicAdmin.track.notSynced')
}
const lyricsStatusClass = (track: MusicTrack) => {
  if (track.synced_lyrics) return 'text-emerald-400'
  if (track.lyrics) return 'text-blue-300'
  return 'text-zinc-500'
}
const releaseForTrack = (track: MusicTrack) => releases.value.find(release => release.id === track.release_id)
const trackReleaseRightsReady = (track: MusicTrack) => {
  const release = releaseForTrack(track)
  return Boolean(release && releaseRightsReady(release))
}
const trackPublishProblems = (track: MusicTrack) => {
  const release = releaseForTrack(track)
  return [
    !track.audio_url && t('musicAdmin.problems.audio'),
    (!track.audio_low_url || !track.audio_medium_url || !track.audio_high_url) && t('musicAdmin.problems.qualities'),
    !release?.copyright_text && t('musicAdmin.problems.copyright'),
    !release?.phonogram_text && t('musicAdmin.problems.phonogram'),
    !release?.territories && t('musicAdmin.problems.territories'),
    !release?.rights_confirmed && t('musicAdmin.problems.confirmation'),
  ].filter(Boolean)
}

const editorKindLabel = (kind: EditorKind) => t(`musicAdmin.editor.${kind}`)
const releaseTypeLabel = (type: string) => t(`musicAdmin.release.${type}`)
const statusLabel = (status: string) => {
  const key = `admin.transcodeJobs.statuses.${status}`
  const translated = t(key)
  return translated === key ? status : translated
}
const formatDate = (value: string) => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(new Date(value))

useHead({ title: () => t('musicAdmin.pageTitle') })
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border: 1px solid rgb(63 63 70);
  border-radius: 8px;
  background: rgb(9 9 11);
}

.stats-grid div {
  padding: 16px;
  border-right: 1px solid rgb(39 39 42);
}

.stats-grid div:last-child {
  border: 0;
}

.stats-grid span,
.stats-grid strong {
  display: block;
}

.stats-grid span {
  color: rgb(161 161 170);
  font-size: 0.75rem;
}

.stats-grid strong {
  margin-top: 4px;
  color: white;
  font-size: 1.75rem;
}

nav button {
  border-bottom: 2px solid transparent;
  padding: 10px 16px;
  color: rgb(161 161 170);
  font-weight: 700;
}

nav button.active {
  border-color: rgb(239 68 68);
  color: white;
}

nav button span {
  margin-left: 4px;
  color: rgb(113 113 122);
  font-size: 0.75rem;
}

.section-toolbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.section-toolbar h2 {
  color: white;
  font-size: 1.35rem;
  font-weight: 700;
}

.section-toolbar p {
  margin-top: 2px;
  color: rgb(161 161 170);
  font-size: 0.875rem;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-actions > button:not(.primary-action) {
  border: 1px solid rgb(63 63 70);
  border-radius: 5px;
  padding: 8px 14px;
  color: rgb(212 212 216);
  font-weight: 700;
}

.toolbar-actions > button:not(.primary-action):hover:not(:disabled) {
  border-color: rgb(113 113 122);
  background: rgb(39 39 42);
  color: white;
}

.toolbar-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.primary-action {
  border-radius: 5px;
  background: rgb(220 38 38);
  padding: 9px 16px;
  color: white;
  font-weight: 700;
}

.primary-action:hover:not(:disabled) {
  background: rgb(239 68 68);
}

.primary-action:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.catalog-table {
  overflow-x: auto;
  border: 1px solid rgb(39 39 42);
  border-radius: 8px;
}

.track-groups {
  display: grid;
  gap: 14px;
}

.track-release-group {
  overflow: hidden;
  border: 1px solid rgb(39 39 42);
  border-radius: 8px;
  background: rgb(9 9 11);
}

.track-release-group > summary {
  display: flex;
  min-height: 68px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  cursor: pointer;
  list-style: none;
  background: rgb(24 24 27);
}

.track-release-group > summary::-webkit-details-marker {
  display: none;
}

.track-release-group > summary:hover {
  background: rgb(31 31 35);
}

.group-summary-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
  color: rgb(161 161 170);
  font-size: 0.78rem;
}

.group-summary-meta > svg {
  width: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  transition: transform 150ms ease;
}

.track-release-group[open] .group-summary-meta > svg {
  transform: rotate(180deg);
}

.track-group-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 9px 14px;
  border-top: 1px solid rgb(39 39 42);
  color: rgb(113 113 122);
  font-size: 0.75rem;
}

.track-group-toolbar > div {
  display: flex;
  gap: 14px;
}

.track-group-toolbar button {
  color: rgb(147 197 253);
  font-weight: 700;
}

.track-group-toolbar button:hover {
  color: white;
}

.grouped-track-table {
  border: 0;
  border-top: 1px solid rgb(39 39 42);
  border-radius: 0;
}

.grouped-track-table table {
  min-width: 52rem;
}

.track-position {
  width: 6rem;
  color: rgb(161 161 170);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.track-empty {
  border: 1px solid rgb(39 39 42);
  border-radius: 8px;
  background: rgb(9 9 11);
}

table {
  width: 100%;
  min-width: 58rem;
  border-collapse: collapse;
  background: rgb(9 9 11);
  color: rgb(212 212 216);
  font-size: 0.875rem;
}

th {
  background: rgb(24 24 27);
  color: rgb(161 161 170);
  font-size: 0.72rem;
  text-align: left;
  text-transform: uppercase;
}

th,
td {
  padding: 12px 14px;
  border-bottom: 1px solid rgb(39 39 42);
}

tbody tr:last-child td {
  border-bottom: 0;
}

tbody tr:hover {
  background: rgb(24 24 27 / 0.6);
}

td strong,
td small {
  display: block;
}

td strong {
  color: white;
}

td small,
.muted {
  margin-top: 3px;
  color: rgb(113 113 122);
}

.release-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.release-cell img,
.cover-empty {
  width: 42px;
  height: 42px;
  flex: none;
  border-radius: 4px;
  background: rgb(39 39 42);
  object-fit: cover;
}

.status {
  display: inline-block;
  border: 1px solid rgb(82 82 91);
  border-radius: 999px;
  padding: 3px 8px;
  color: rgb(212 212 216);
  font-size: 0.7rem;
  text-transform: capitalize;
}

.status.published {
  border-color: rgb(6 78 59);
  color: rgb(110 231 183);
}

.actions {
  text-align: right;
  white-space: nowrap;
}

.actions button {
  margin-left: 12px;
  color: rgb(147 197 253);
  font-weight: 600;
}

.actions button:hover {
  color: white;
}

.actions .danger {
  color: rgb(252 165 165);
}

.empty {
  padding: 48px;
  color: rgb(113 113 122);
  text-align: center;
}

.editor-backdrop {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  width: 100vw;
  height: 100dvh;
  justify-content: end;
  background: rgb(0 0 0 / 0.72);
}

.editor-panel {
  display: flex;
  width: min(46rem, 100%);
  height: 100dvh;
  max-height: 100dvh;
  flex-direction: column;
  overflow: hidden;
  border-left: 1px solid rgb(63 63 70);
  background: rgb(9 9 11);
  box-shadow: -20px 0 60px rgb(0 0 0 / 0.45);
}

.editor-panel > header,
.editor-panel > footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex: none;
  padding: 18px 22px;
  border-bottom: 1px solid rgb(39 39 42);
}

.editor-panel > header {
  padding-top: max(18px, env(safe-area-inset-top));
}

.editor-panel > header p {
  color: rgb(248 113 113);
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}

.editor-panel > header h2 {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
}

.editor-panel > header button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgb(39 39 42);
  color: white;
  font-size: 1.75rem;
  line-height: 1;
}

.editor-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  flex: 1;
  align-content: start;
  overflow-y: auto;
  padding: 22px;
}

.editor-fields label {
  min-width: 0;
}

.editor-fields label > span {
  display: block;
  margin-bottom: 6px;
  color: rgb(212 212 216);
  font-size: 0.82rem;
  font-weight: 700;
}

.editor-fields input:not([type="checkbox"]),
.editor-fields select,
.editor-fields textarea {
  width: 100%;
  border: 1px solid rgb(63 63 70);
  border-radius: 5px;
  background: rgb(24 24 27);
  padding: 10px 11px;
  color: white;
  outline: none;
}

.editor-fields input:focus,
.editor-fields select:focus,
.editor-fields textarea:focus {
  border-color: rgb(239 68 68);
}

.editor-fields .wide,
.section-label {
  grid-column: 1 / -1;
}

.editor-fields .check {
  display: flex;
  align-items: start;
  gap: 9px;
}

.editor-fields .check span {
  margin: 0;
}

.editor-fields label small {
  color: rgb(113 113 122);
  font-weight: 400;
}

.release-cover-preview {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid rgb(63 63 70);
  border-radius: 6px;
  background: rgb(24 24 27);
  padding: 10px;
}

.release-cover-preview img {
  width: 72px;
  height: 72px;
  flex: none;
  border-radius: 5px;
  object-fit: cover;
}

.release-cover-preview strong,
.release-cover-preview small,
.lyrics-sync-box strong,
.lyrics-sync-box small,
.embedded-artwork-picker strong,
.embedded-artwork-picker small {
  display: block;
}

.release-cover-preview strong,
.lyrics-sync-box strong,
.embedded-artwork-picker strong {
  color: white;
  font-size: 0.85rem;
}

.release-cover-preview small,
.lyrics-sync-box small,
.embedded-artwork-picker small {
  margin-top: 3px;
  color: rgb(113 113 122);
  font-size: 0.75rem;
}

.lyrics-sync-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid rgb(63 63 70);
  border-radius: 6px;
  background: rgb(24 24 27 / 0.72);
  padding: 12px;
}

.lyrics-sync-box button {
  flex: none;
  min-height: 40px;
  border-radius: 5px;
  background: rgb(39 39 42);
  padding: 8px 13px;
  color: white;
  font-size: 0.8rem;
  font-weight: 800;
}

.lyrics-sync-box button:hover:not(:disabled) {
  background: rgb(63 63 70);
}

.lyrics-sync-box button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.embedded-artwork-picker {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(12rem, 16rem) auto;
  align-items: center;
  gap: 12px;
  border: 1px solid rgb(63 63 70);
  border-radius: 6px;
  background: rgb(24 24 27 / 0.72);
  padding: 12px;
}

.embedded-artwork-picker button {
  min-height: 40px;
  border-radius: 5px;
  background: rgb(225 29 72);
  padding: 8px 13px;
  color: white;
  font-size: 0.8rem;
  font-weight: 800;
}

.embedded-artwork-picker button:hover:not(:disabled) {
  background: rgb(244 63 94);
}

.embedded-artwork-picker button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.bulk-import-panel {
  width: min(54rem, 100%);
}

.quick-upload-panel {
  width: min(58rem, 100%);
}

.quick-step {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 22px;
}

.quick-drop-zone {
  display: grid;
  min-height: 15rem;
  place-items: center;
  gap: 8px;
  border: 1px dashed rgb(82 82 91);
  border-radius: 8px;
  background: rgb(24 24 27 / 0.68);
  color: rgb(161 161 170);
  padding: 28px;
  text-align: center;
  transition: border-color 160ms ease, background 160ms ease;
}

.quick-drop-zone.over,
.quick-drop-zone:hover {
  border-color: rgb(248 113 113);
  background: rgb(127 29 29 / 0.18);
}

.quick-drop-zone input {
  display: none;
}

.quick-drop-zone strong {
  color: white;
  font-size: 1.3rem;
}

.quick-drop-zone span {
  font-size: 0.9rem;
}

.quick-file-list {
  margin-top: 18px;
  border: 1px solid rgb(39 39 42);
  border-radius: 8px;
  overflow: hidden;
}

.quick-file-list li {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgb(39 39 42);
  background: rgb(9 9 11);
  padding: 12px 14px;
}

.quick-file-list li:last-child {
  border-bottom: 0;
}

.quick-file-list li > span {
  color: rgb(113 113 122);
  font-weight: 800;
  text-align: center;
}

.quick-file-list strong,
.quick-file-list small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-file-list strong {
  color: white;
}

.quick-file-list small {
  color: rgb(113 113 122);
  font-size: 0.76rem;
}

.quick-details {
  border-bottom: 0;
}

.quick-cover-preview {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid rgb(63 63 70);
  border-radius: 6px;
  background: rgb(24 24 27 / 0.72);
  padding: 12px;
}

.quick-cover-preview img {
  width: 72px;
  height: 72px;
  flex: none;
  border-radius: 6px;
  object-fit: cover;
}

.quick-cover-preview strong,
.quick-cover-preview small {
  display: block;
}

.quick-cover-preview strong {
  color: white;
  font-size: 0.85rem;
}

.quick-cover-preview small {
  margin-top: 3px;
  color: rgb(113 113 122);
  font-size: 0.75rem;
}

.quick-review-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border: 1px solid rgb(39 39 42);
  border-radius: 8px;
  background: rgb(24 24 27 / 0.72);
  padding: 14px;
}

.quick-review-heading strong,
.quick-review-heading span {
  display: block;
}

.quick-review-heading strong {
  color: white;
}

.quick-review-heading span {
  color: rgb(161 161 170);
  font-size: 0.85rem;
}

.quick-review-list {
  padding-inline: 0;
}

.bulk-import-panel .editor-fields {
  flex: none;
  overflow: visible;
  border-bottom: 1px solid rgb(39 39 42);
}

.bulk-track-list {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 8px 22px;
}

.bulk-track-list li {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) 5rem auto;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid rgb(39 39 42);
}

.bulk-track-list.quick-review-list li {
  grid-template-columns: 4.25rem 5.25rem minmax(12rem, 1fr) 5.5rem auto;
  gap: 12px;
  padding-block: 12px;
}

.quick-review-list li > input {
  text-align: center;
}

.quick-review-list li > div:not(.bulk-actions) {
  min-width: 0;
}

.bulk-track-list li.done {
  opacity: 0.68;
}

.bulk-position {
  color: rgb(113 113 122);
  font-size: 0.8rem;
  text-align: center;
}

.bulk-track-list input {
  width: 100%;
  border: 1px solid rgb(63 63 70);
  border-radius: 5px;
  background: rgb(24 24 27);
  padding: 8px 10px;
  color: white;
  outline: none;
}

.bulk-track-list input:focus {
  border-color: rgb(239 68 68);
}

.bulk-track-list small {
  display: block;
  margin-top: 3px;
  overflow: hidden;
  color: rgb(113 113 122);
  font-size: 0.7rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bulk-status {
  color: rgb(161 161 170);
  font-size: 0.72rem;
  text-align: right;
}

.done .bulk-status {
  color: rgb(110 231 183);
}

.error .bulk-status {
  color: rgb(252 165 165);
}

.bulk-actions {
  display: flex;
  gap: 2px;
}

.bulk-actions button {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50%;
  color: rgb(161 161 170);
}

.bulk-actions button:hover:not(:disabled) {
  background: rgb(39 39 42);
  color: white;
}

.bulk-actions button:disabled {
  opacity: 0.2;
}

.section-label {
  padding-top: 8px;
  border-top: 1px solid rgb(39 39 42);
  color: white;
  font-size: 1rem;
  font-weight: 800;
}

.video-selection {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border: 1px solid rgb(63 63 70);
  border-radius: 6px;
  padding: 10px;
  background: rgb(24 24 27);
}

.video-selection img,
.video-selection-empty {
  width: 96px;
  aspect-ratio: 16 / 9;
  border-radius: 4px;
  background: rgb(39 39 42);
  object-fit: cover;
}

.video-selection strong,
.video-selection small {
  display: block;
}

.video-selection strong {
  color: white;
}

.video-selection small {
  margin-top: 3px;
  color: rgb(161 161 170);
}

.video-selection button {
  color: rgb(252 165 165);
  font-size: 0.8rem;
  font-weight: 700;
}

.video-picker-results {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  max-height: 20rem;
  margin-top: 10px;
  overflow-y: auto;
}

.video-picker-results button {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  min-width: 0;
  border: 1px solid rgb(39 39 42);
  border-radius: 5px;
  padding: 7px;
  text-align: left;
}

.video-picker-results button:hover {
  border-color: rgb(239 68 68);
  background: rgb(24 24 27);
}

.video-picker-results img,
.video-result-empty {
  width: 88px;
  aspect-ratio: 16 / 9;
  border-radius: 3px;
  background: rgb(39 39 42);
  object-fit: cover;
}

.video-picker-results span,
.video-picker-results strong,
.video-picker-results small {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-picker-results strong {
  color: white;
  font-size: 0.78rem;
}

.video-picker-results small {
  margin-top: 3px;
  color: rgb(113 113 122);
  font-size: 0.7rem;
}

.editor-panel > footer {
  justify-content: end;
  border-top: 1px solid rgb(39 39 42);
  border-bottom: 0;
  padding-bottom: max(18px, env(safe-area-inset-bottom));
}

.editor-panel > footer button:not(.primary-action) {
  padding: 9px 16px;
  color: rgb(212 212 216);
}

.editor-error {
  margin: 0 22px;
  border: 1px solid rgb(127 29 29);
  background: rgb(69 10 10 / 0.45);
  padding: 10px;
  color: rgb(254 202 202);
  font-size: 0.875rem;
}

.upload-progress {
  height: 4px;
  margin: 0 22px;
  overflow: hidden;
  background: rgb(39 39 42);
}

.upload-progress span {
  display: block;
  height: 100%;
  background: rgb(239 68 68);
  transition: width 150ms ease;
}

@media (max-width: 700px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .stats-grid div {
    border-bottom: 1px solid rgb(39 39 42);
  }

  .section-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .toolbar-actions button {
    width: 100%;
  }

  .track-release-group > summary {
    align-items: flex-start;
    flex-direction: column;
  }

  .group-summary-meta {
    width: 100%;
    justify-content: space-between;
  }

  .track-group-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .track-group-toolbar > div {
    width: 100%;
    justify-content: space-between;
  }

  .editor-panel {
    border: 0;
  }

  .editor-fields {
    grid-template-columns: 1fr;
    padding: 18px 16px;
  }

  .editor-fields .wide,
  .section-label {
    grid-column: 1;
  }

  .embedded-artwork-picker {
    grid-template-columns: 1fr;
  }

  .video-picker-results {
    grid-template-columns: 1fr;
  }

  .bulk-track-list {
    padding: 6px 14px;
  }

  .bulk-track-list li {
    grid-template-columns: 1.5rem minmax(0, 1fr) auto;
  }

  .bulk-track-list.quick-review-list li {
    grid-template-columns: 3.75rem 4.5rem minmax(0, 1fr);
    align-items: start;
  }

  .quick-review-list .bulk-status {
    display: block;
    grid-column: 1 / -1;
    text-align: left;
  }

  .quick-review-list .bulk-actions {
    grid-column: 1 / -1;
    flex-direction: row;
  }

  .bulk-status {
    display: none;
  }

  .bulk-actions {
    flex-direction: column;
  }
}
</style>
