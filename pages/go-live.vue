<template>
  <div class="min-h-screen bg-[#050507] text-white" :class="{ 'mobile-in-app-live': isLoggedIn && activeTab === 'in-app' }">
    <div class="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6" :class="{ 'max-lg:min-h-dvh max-lg:p-0': isLoggedIn && activeTab === 'in-app' }">
      <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" :class="{ 'max-lg:hidden': isLoggedIn && activeTab === 'in-app' }">
        <div>
          <h1 class="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{{ t('goLive.title') }}</h1>
          <p class="mt-2 max-w-2xl text-gray-400">{{ t('goLive.subtitle') }}</p>
        </div>

        <div class="flex rounded-full border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            :class="tabButtonClass(activeTab === 'in-app')"
            @click="activeTab = 'in-app'"
          >
            {{ t('goLive.inAppTab') }}
          </button>
          <button
            type="button"
            :class="tabButtonClass(activeTab === 'encoder')"
            @click="activeTab = 'encoder'"
          >
            {{ t('goLive.customEncoderTab') }}
          </button>
        </div>
      </div>

      <div v-if="!isLoggedIn" class="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl">
        <p class="text-gray-300">{{ t('goLive.loginRequired') }}</p>
        <NuxtLink :to="localePath('/login')" class="mt-4 inline-flex rounded-full bg-red-600 px-5 py-2.5 font-semibold transition hover:bg-red-500">
          {{ t('goLive.signIn') }}
        </NuxtLink>
      </div>

      <template v-else>
        <section class="mb-5 grid gap-3 rounded-3xl border border-white/10 bg-zinc-950/80 p-4 shadow-2xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_13rem]" :class="{ 'max-lg:hidden': activeTab === 'in-app' }">
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-gray-300">{{ t('goLive.channel') }}</span>
            <select
              v-model="selectedChannelId"
              class="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-red-500"
            >
              <option disabled value="">{{ t('goLive.selectChannel') }}</option>
              <option v-for="ch in channels" :key="ch.id" :value="ch.id">{{ ch.name }}</option>
            </select>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-gray-300">{{ t('goLive.liveTitle') }}</span>
            <input
              v-model="title"
              type="text"
              maxlength="120"
              class="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-red-500"
            />
          </label>
          <div class="rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3">
            <p class="text-xs font-bold uppercase tracking-[0.25em] text-gray-500">{{ t('goLive.status') }}</p>
            <p class="mt-1 text-lg font-black" :class="isLive ? 'text-emerald-400' : 'text-gray-300'">
              {{ isLive ? t('goLive.live') : t('goLive.offline') }}
            </p>
          </div>
          <label class="block lg:col-span-2">
            <span class="mb-2 block text-sm font-semibold text-gray-300">{{ t('goLive.description') }}</span>
            <textarea
              v-model="description"
              rows="2"
              maxlength="400"
              class="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-red-500"
            />
          </label>
          <label class="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3 lg:col-span-2">
            <input v-model="dvrEnabled" type="checkbox" class="h-4 w-4 accent-red-600" />
              <span>
              <span class="block text-sm font-black text-white">{{ t('goLive.dvrRecording') }}</span>
              <span class="block text-xs text-gray-400">{{ t('goLive.dvrHelper') }}</span>
            </span>
          </label>
          <div class="flex items-end">
            <button
              type="button"
              :disabled="savingSettings || !selectedChannelId"
              class="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              @click="saveSettings"
            >
              {{ savingSettings ? t('goLive.saving') : t('goLive.saveSettings') }}
            </button>
          </div>
        </section>

        <section
          v-if="activeTab === 'in-app'"
          class="in-app-live-stage grid min-h-0 gap-5 lg:h-[calc(100dvh-18rem)] lg:grid-cols-[minmax(0,1fr)_24rem]"
          :class="{ 'mobile-live-landscape': orientation === 'horizontal' }"
        >
          <div class="mobile-live-preview-shell relative flex min-h-[32rem] min-w-0 items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-2xl lg:h-full">
            <div
              ref="previewFrame"
              class="mobile-live-preview-frame relative max-h-[calc(100dvh-15rem)] min-h-[32rem] touch-none overflow-hidden bg-black"
              :class="[
                orientation === 'vertical'
                  ? 'aspect-[9/16] h-full w-auto max-w-full'
                  : 'aspect-video h-auto w-full'
              ]"
              @pointerdown="beginFrameDrag"
            >
              <video
                ref="previewVideo"
                autoplay
                playsinline
                muted
                class="mobile-preview-video absolute inset-0 h-full w-full bg-black object-cover"
                :class="frameDragging ? 'cursor-grabbing' : localStream ? 'cursor-grab' : ''"
                :style="previewVideoStyle"
              />
            </div>

            <div
              v-if="mustRotateForHorizontal"
              class="absolute inset-0 z-40 flex items-center justify-center bg-black/72 p-6 text-center backdrop-blur-sm lg:hidden"
            >
              <div class="max-w-sm rounded-3xl border border-white/15 bg-zinc-950/90 p-5 shadow-2xl">
                <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-300/25 bg-red-500/15 text-xs font-black uppercase tracking-[0.18em] text-red-100">
                  {{ t('goLive.rotate') }}
                </div>
                <h2 class="mt-4 text-2xl font-black">{{ t('goLive.turnPhoneSideways') }}</h2>
                <p class="mt-2 text-sm text-zinc-300">
                  {{ t('goLive.landscapeRequired') }}
                </p>
              </div>
            </div>

            <div v-if="!localStream" class="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(239,68,68,0.18),_rgba(0,0,0,0.92)_55%)] p-6 text-center">
              <div class="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80">{{ t('goLive.cameraPreview') }}</div>
              <h2 class="mt-5 text-3xl font-black">{{ t('goLive.startFromBrowser') }}</h2>
              <p class="mt-2 max-w-md text-sm text-gray-300">{{ t('goLive.browserLiveHelper') }}</p>
              <button type="button" class="mt-6 rounded-full bg-red-600 px-6 py-3 font-bold shadow-lg shadow-red-950/50 transition hover:bg-red-500" @click="startPreview">
                {{ t('goLive.enableCamera') }}
              </button>
            </div>

            <button
              type="button"
              class="mobile-live-back-button absolute left-4 top-4 z-50 rounded-full border border-white/15 bg-black/55 px-4 py-2 text-sm font-black text-white shadow-lg backdrop-blur transition hover:bg-white/15 lg:hidden"
              :aria-label="t('goLive.back')"
              :title="t('goLive.back')"
              @click="leaveInAppStreamer"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.25" d="M15 19 8 12l7-7" />
              </svg>
              <span class="sr-only">{{ t('goLive.back') }}</span>
            </button>

            <div class="mobile-live-status-pills pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
              <span class="rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs font-bold backdrop-blur">
                {{ orientation === 'vertical' ? t('goLive.vertical') : t('goLive.horizontal') }}
              </span>
              <span v-if="localStream" class="rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs font-bold backdrop-blur">
                {{ t('goLive.dragToFrame') }}
              </span>
              <span v-if="inAppPublishing" class="rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-widest shadow-lg shadow-red-950/50">
                {{ t('goLive.live') }}
              </span>
            </div>

            <div v-if="localStream" class="pointer-events-none absolute inset-0 border-[min(7vw,3rem)] border-black/10" />

            <div class="mobile-live-controls-overlay absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/65 to-transparent p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div ref="mobileChatListRef" class="mobile-live-chat-overlay mb-4 max-h-[30dvh] space-y-2 overflow-y-auto overscroll-contain pr-1 lg:hidden">
                <div v-for="msg in chatMessages" :key="msg.id" class="max-w-[88%] rounded-2xl bg-black/45 px-3 py-2 text-sm backdrop-blur">
                  <span class="font-bold text-red-200">{{ msg.channel?.name || t('goLive.viewer') }}:</span>
                  <span class="ml-1 text-white/95">{{ msg.message }}</span>
                </div>
              </div>

              <div class="mobile-live-control-stack">
                <div class="mobile-live-action-bar flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:bg-zinc-200"
                    :aria-label="localStream ? t('goLive.refreshCamera') : t('goLive.enableCamera')"
                    :title="localStream ? t('goLive.refreshCamera') : t('goLive.enableCamera')"
                    @click="refreshPreviewCamera"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V5a1 1 0 0 1 1-1h3m12 12v3a1 1 0 0 1-1 1h-3M5 19a8 8 0 0 0 13.66-4M19 5A8 8 0 0 0 5.34 9" />
                    </svg>
                    <span class="sr-only">{{ localStream ? t('goLive.refreshCamera') : t('goLive.enableCamera') }}</span>
                  </button>
                  <button
                    type="button"
                    :disabled="cameraDevices.length < 2"
                    class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-40"
                    :aria-label="t('goLive.switchCamera')"
                    :title="t('goLive.switchCamera')"
                    @click="switchCamera"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h3l2-2h6l2 2h3v10H4V8Z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13a3 3 0 1 0 6 0 3 3 0 0 0-6 0Zm9-7 2 2-2 2M6 18l-2-2 2-2" />
                    </svg>
                    <span class="sr-only">{{ t('goLive.switchCamera') }}</span>
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                    :aria-label="streamSettingsOpen ? t('goLive.closeSettings') : t('goLive.settings')"
                    :title="streamSettingsOpen ? t('goLive.closeSettings') : t('goLive.settings')"
                    @click="streamSettingsOpen = !streamSettingsOpen"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.827 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.757.426 1.757 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.827 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.757-2.924 1.757-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.827-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.757-.426-1.757-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.827-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    <span class="sr-only">{{ streamSettingsOpen ? t('goLive.closeSettings') : t('goLive.settings') }}</span>
                  </button>
                  <button
                    v-if="!inAppPublishing"
                    type="button"
                    :disabled="!selectedChannelId || publishing || mustRotateForHorizontal"
                    class="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-500 disabled:opacity-40"
                    :aria-label="mustRotateForHorizontal ? t('goLive.rotatePhone') : publishing ? t('goLive.starting') : t('goLive.startLive')"
                    :title="mustRotateForHorizontal ? t('goLive.rotatePhone') : publishing ? t('goLive.starting') : t('goLive.startLive')"
                    @click="beginInAppLive(orientation)"
                  >
                    <svg v-if="mustRotateForHorizontal" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm4 14h.01M3 9l2-2 2 2m10 6 2 2 2-2" />
                    </svg>
                    <svg v-else-if="publishing" class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
                    </svg>
                    <svg v-else class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 5.14v13.72a1 1 0 0 0 1.55.83l10.29-6.86a1 1 0 0 0 0-1.66L9.55 4.31A1 1 0 0 0 8 5.14Z" />
                    </svg>
                    <span class="sr-only">{{ mustRotateForHorizontal ? t('goLive.rotatePhone') : publishing ? t('goLive.starting') : t('goLive.startLive') }}</span>
                  </button>
                  <button
                    v-else
                    type="button"
                    :disabled="publishing"
                    class="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-black transition hover:bg-white disabled:opacity-40"
                    :aria-label="publishing ? t('goLive.stopping') : t('goLive.endLive')"
                    :title="publishing ? t('goLive.stopping') : t('goLive.endLive')"
                    @click="stopInAppLive"
                  >
                    <svg v-if="publishing" class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
                    </svg>
                    <svg v-else class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M7 7h10v10H7V7Z" />
                    </svg>
                    <span class="sr-only">{{ publishing ? t('goLive.stopping') : t('goLive.endLive') }}</span>
                  </button>
                </div>

                <div v-if="streamSettingsOpen" class="mt-3 max-h-[68dvh] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur">
                  <div class="mb-4 grid gap-3 border-b border-white/10 pb-4 lg:hidden">
                    <label class="block">
                      <span class="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">{{ t('goLive.channel') }}</span>
                      <select
                        v-model="selectedChannelId"
                        class="w-full rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm text-white outline-none focus:border-red-400"
                      >
                        <option disabled value="">{{ t('goLive.selectChannel') }}</option>
                        <option v-for="ch in channels" :key="ch.id" :value="ch.id">{{ ch.name }}</option>
                      </select>
                    </label>
                    <label class="block">
                      <span class="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">{{ t('goLive.liveTitle') }}</span>
                      <input
                        v-model="title"
                        type="text"
                        maxlength="120"
                        class="w-full rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm text-white outline-none focus:border-red-400"
                      />
                    </label>
                    <label class="block">
                      <span class="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">{{ t('goLive.description') }}</span>
                      <textarea
                        v-model="description"
                        rows="2"
                        maxlength="400"
                        class="w-full resize-none rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm text-white outline-none focus:border-red-400"
                      />
                    </label>
                    <label class="flex items-center gap-3 rounded-xl border border-white/10 bg-black/55 px-3 py-2">
                      <input v-model="dvrEnabled" type="checkbox" class="h-4 w-4 accent-red-500" />
                      <span>
                        <span class="block text-sm font-black text-white">{{ t('goLive.dvrRecording') }}</span>
                        <span class="block text-xs text-gray-400">{{ t('goLive.dvrShortHelper') }}</span>
                      </span>
                    </label>
                    <div class="flex items-center gap-2">
                      <span class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold" :class="isLive ? 'text-emerald-300' : 'text-gray-300'">
                        {{ isLive ? t('goLive.live') : t('goLive.offline') }}
                      </span>
                      <button
                        type="button"
                        :disabled="savingSettings || !selectedChannelId"
                        class="ml-auto rounded-full bg-white px-4 py-2 text-xs font-black text-black transition hover:bg-zinc-200 disabled:opacity-40"
                        @click="saveSettings"
                      >
                        {{ savingSettings ? t('goLive.saving') : t('goLive.saveSettings') }}
                      </button>
                    </div>
                  </div>
                  <div class="mb-3 flex flex-wrap items-center gap-2">
                    <span class="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">{{ t('goLive.orientation') }}</span>
                    <button
                      type="button"
                      :disabled="inAppPublishing"
                      :class="orientationButtonClass(orientation === 'vertical')"
                      @click="setOrientation('vertical')"
                    >
                      {{ t('goLive.vertical') }}
                    </button>
                    <button
                      type="button"
                      :disabled="inAppPublishing"
                      :class="orientationButtonClass(orientation === 'horizontal')"
                      @click="setOrientation('horizontal')"
                    >
                      {{ t('goLive.horizontal') }}
                    </button>
                  </div>
                  <div v-if="localStream" class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <label class="text-xs font-semibold text-gray-300">
                      {{ t('goLive.frameX') }}
                      <input v-model.number="frameX" type="range" min="0" max="100" class="mt-1 w-full accent-red-500" />
                    </label>
                    <label class="text-xs font-semibold text-gray-300">
                      {{ t('goLive.frameY') }}
                      <input v-model.number="frameY" type="range" min="0" max="100" class="mt-1 w-full accent-red-500" />
                    </label>
                    <button type="button" class="self-end rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20" @click="resetFrame">
                      {{ t('goLive.center') }}
                    </button>
                  </div>
                </div>

                <form v-if="inAppPublishing" class="mt-3 flex gap-2 lg:hidden" @submit.prevent="sendChatMessage">
                  <input v-model="chatInput" maxlength="500" :placeholder="t('goLive.replyToChat')" class="min-w-0 flex-1 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-sm outline-none backdrop-blur focus:border-red-400" />
                  <button type="submit" :disabled="chatSending || !canSendChat" class="rounded-full bg-white px-4 py-2 text-sm font-black text-black disabled:opacity-40">{{ t('live.send') }}</button>
                </form>
                <p v-if="chatError" class="mt-2 rounded-full bg-red-950/70 px-3 py-1 text-xs font-semibold text-red-100 lg:hidden">{{ chatError }}</p>
              </div>
            </div>
          </div>

          <aside class="hidden min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/90 shadow-2xl lg:flex">
            <div class="border-b border-white/10 p-4">
              <p class="text-lg font-black">{{ t('live.liveChat') }}</p>
              <p class="text-sm text-gray-400">{{ t('goLive.chatHelper') }}</p>
            </div>
            <div ref="chatListRef" class="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              <p v-if="chatMessages.length === 0" class="text-sm text-gray-500">{{ t('goLive.chatEmpty') }}</p>
              <div v-for="msg in chatMessages" :key="msg.id" class="rounded-2xl bg-zinc-900 px-3 py-2">
                <p class="text-xs font-bold text-red-200">{{ msg.channel?.name || t('goLive.viewer') }}</p>
                <p class="mt-1 text-sm text-gray-100">{{ msg.message }}</p>
              </div>
            </div>
            <form class="border-t border-white/10 p-4" @submit.prevent="sendChatMessage">
              <div class="flex gap-2">
                <input v-model="chatInput" maxlength="500" :placeholder="t('goLive.replyToChat')" class="min-w-0 flex-1 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm outline-none focus:border-red-500" />
                <button type="submit" :disabled="chatSending || !canSendChat" class="rounded-full bg-red-600 px-4 py-2 text-sm font-black disabled:opacity-40">{{ t('live.send') }}</button>
              </div>
              <p v-if="chatError" class="mt-2 text-xs text-red-400">{{ chatError }}</p>
            </form>
          </aside>
        </section>

        <section v-else class="mx-auto w-full max-w-4xl space-y-5 rounded-3xl border border-white/10 bg-zinc-950/80 p-5 shadow-2xl">
          <div class="grid gap-3 md:grid-cols-2">
            <div class="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <p class="text-xs text-gray-400 uppercase tracking-wide">{{ t('goLive.started') }}</p>
              <p class="mt-1 text-sm text-gray-200">{{ live?.started_at ? formatDate(live.started_at) : t('goLive.notLive') }}</p>
            </div>
            <div class="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <p class="text-xs text-gray-400 uppercase tracking-wide">{{ t('goLive.publisherPresence') }}</p>
              <label class="mt-2 inline-flex items-center gap-2">
                <input v-model="publisherPresenceEnabled" type="checkbox" :disabled="savingPublisherPresence" class="h-4 w-4 accent-red-600" @change="updatePublisherPresence" />
                <span class="text-sm">{{ t('goLive.enabled') }}</span>
              </label>
            </div>
            <div class="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <p class="text-xs text-gray-400 uppercase tracking-wide">{{ t('goLive.dvrRecording') }}</p>
              <label class="mt-2 inline-flex items-center gap-2">
                <input v-model="dvrEnabled" type="checkbox" class="h-4 w-4 accent-red-600" />
                <span class="text-sm">{{ t('goLive.saveLiveAsVideo') }}</span>
              </label>
            </div>
          </div>

          <div class="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-4">
            <div>
              <p class="text-xs text-gray-400 uppercase tracking-wide">{{ t('goLive.publicIngestUrl') }}</p>
              <p class="mt-1 break-all text-sm">{{ live?.ingest_url || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 uppercase tracking-wide">{{ t('goLive.streamKey') }}</p>
              <div class="mt-1 flex flex-wrap items-center gap-2">
                <input :type="showStreamKey ? 'text' : 'password'" :value="live?.stream_key || ''" readonly class="min-w-0 flex-1 rounded bg-black/40 border border-zinc-700 px-3 py-2 text-sm" />
                <button type="button" class="rounded bg-zinc-700 px-3 py-2 text-xs font-bold transition hover:bg-zinc-600" @click="showStreamKey = !showStreamKey">{{ showStreamKey ? t('goLive.hide') : t('goLive.show') }}</button>
                <button type="button" class="rounded bg-zinc-700 px-3 py-2 text-xs font-bold transition hover:bg-zinc-600" @click="copyValue(live?.stream_key || '')">{{ t('goLive.copy') }}</button>
              </div>
            </div>
            <div v-if="live?.ingest_url_lan">
              <p class="text-xs text-gray-400 uppercase tracking-wide">{{ t('goLive.lanIngestUrl') }}</p>
              <div class="mt-1 flex gap-2">
                <input type="text" :value="live?.ingest_url_lan || ''" readonly class="min-w-0 flex-1 rounded bg-black/40 border border-zinc-700 px-3 py-2 text-sm" />
                <button type="button" class="rounded bg-zinc-700 px-3 py-2 text-xs font-bold transition hover:bg-zinc-600" @click="copyValue(live?.ingest_url_lan || '')">{{ t('goLive.copy') }}</button>
              </div>
            </div>
            <div>
              <p class="text-xs text-gray-400 uppercase tracking-wide">{{ t('goLive.playbackUrl') }}</p>
              <div class="mt-1 flex gap-2">
                <input type="text" :value="live?.playback_url || ''" readonly class="min-w-0 flex-1 rounded bg-black/40 border border-zinc-700 px-3 py-2 text-sm" />
                <button type="button" class="rounded bg-zinc-700 px-3 py-2 text-xs font-bold transition hover:bg-zinc-600" @click="copyValue(live?.playback_url || '')">{{ t('goLive.copy') }}</button>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" :disabled="savingSettings || !selectedChannelId" class="rounded-full bg-blue-600 px-4 py-2 font-bold transition hover:bg-blue-500 disabled:opacity-50" @click="saveSettings">
              {{ savingSettings ? t('goLive.saving') : t('goLive.saveSettings') }}
            </button>
            <button type="button" :disabled="saving || !selectedChannelId" class="rounded-full bg-green-600 px-4 py-2 font-bold transition hover:bg-green-500 disabled:opacity-50" @click="startStream">
              {{ saving && pendingAction === 'start' ? t('goLive.starting') : t('goLive.goLive') }}
            </button>
            <button type="button" :disabled="saving || !selectedChannelId" class="rounded-full bg-zinc-700 px-4 py-2 font-bold transition hover:bg-zinc-600 disabled:opacity-50" @click="stopStream">
              {{ saving && pendingAction === 'stop' ? t('goLive.stopping') : t('goLive.endStream') }}
            </button>
            <button type="button" :disabled="saving || !selectedChannelId" class="rounded-full bg-red-600 px-4 py-2 font-bold transition hover:bg-red-500 disabled:opacity-50" @click="rotateKey">
              {{ saving && pendingAction === 'rotate' ? t('goLive.rotating') : t('goLive.rotateStreamKey') }}
            </button>
            <NuxtLink v-if="selectedChannelId" :to="localePath(`/live/${selectedChannelId}`)" class="rounded-full bg-blue-600 px-4 py-2 font-bold transition hover:bg-blue-500">
              {{ t('goLive.openWatchPage') }}
            </NuxtLink>
            <button v-if="selectedChannelId" type="button" class="rounded-full bg-zinc-700 px-4 py-2 font-bold transition hover:bg-zinc-600" @click="openChatPopup">
              {{ t('goLive.popOutChat') }}
            </button>
          </div>
        </section>

        <p v-if="message" class="mt-4 rounded-2xl border px-4 py-3 text-sm" :class="[error ? 'border-red-500/30 bg-red-950/40 text-red-100' : 'border-emerald-500/30 bg-emerald-950/40 text-emerald-100', activeTab === 'in-app' ? 'max-lg:fixed max-lg:left-3 max-lg:right-3 max-lg:top-3 max-lg:z-[70] max-lg:mt-0 max-lg:bg-black/75 max-lg:backdrop-blur' : '']">{{ message }}</p>
      </template>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import {
  getLiveChatMessages,
  getMyLiveStream,
  postLiveChatMessage,
  rotateMyLiveStreamKey,
  saveMyLiveStreamSettings,
  setMyPublisherPresence,
  startMyLiveStream,
  stopMyLiveStream,
  type LiveChatMessage,
  type LiveStreamState
} from '~/app/service/live'
import { useMetaTags } from '~/app/composables/useMetaTags'

const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()

useMetaTags({
  title: t('goLive.metaTitle'),
  description: t('goLive.metaDescription')
})

type LocalChannel = {
  id: string
  name: string
}

const activeTab = ref<'in-app' | 'encoder'>('in-app')
const isLoggedIn = ref(false)
const channels = ref<LocalChannel[]>([])
const selectedChannelId = ref('')
const live = ref<LiveStreamState | null>(null)
const title = ref(t('goLive.defaultTitle'))
const description = ref('')
const showStreamKey = ref(false)
const saving = ref(false)
const pendingAction = ref<'start' | 'stop' | 'rotate' | ''>('')
const message = ref('')
const error = ref(false)
const publisherPresenceEnabled = ref(false)
const dvrEnabled = ref(true)
const savingPublisherPresence = ref(false)
const savingSettings = ref(false)

const previewFrame = ref<HTMLElement | null>(null)
const previewVideo = ref<HTMLVideoElement | null>(null)
const localStream = ref<MediaStream | null>(null)
const publishStream = ref<MediaStream | null>(null)
const cameraDevices = ref<MediaDeviceInfo[]>([])
const selectedCameraId = ref('')
const orientation = ref<'vertical' | 'horizontal'>('vertical')
const streamSettingsOpen = ref(false)
const publishing = ref(false)
const inAppPublishing = ref(false)
const peerConnection = ref<RTCPeerConnection | null>(null)
const whipResourceUrl = ref('')
const frameX = ref(50)
const frameY = ref(50)
const frameDragStart = ref({ pointerId: 0, x: 0, y: 0, frameX: 50, frameY: 50 })
const frameDragging = ref(false)
const viewportWidth = ref(0)
const viewportHeight = ref(0)
let publishAnimationFrame = 0
let allowingStreamerLeave = false

const chatMessages = ref<LiveChatMessage[]>([])
const chatInput = ref('')
const chatSending = ref(false)
const chatError = ref('')
const chatListRef = ref<HTMLElement | null>(null)
const mobileChatListRef = ref<HTMLElement | null>(null)
let chatPollTimer: ReturnType<typeof setInterval> | null = null

const isLive = computed(() => inAppPublishing.value || live.value?.status === 'live' || live.value?.is_live)
const canSendChat = computed(() => selectedChannelId.value && chatInput.value.trim().length > 0 && inAppPublishing.value)
const isMobileViewport = computed(() => viewportWidth.value > 0 && viewportWidth.value < 1024)
const isViewportLandscape = computed(() => viewportWidth.value > viewportHeight.value)
const mustRotateForHorizontal = computed(() => isMobileViewport.value && orientation.value === 'horizontal' && !isViewportLandscape.value)
const frameObjectPosition = computed(() => `${frameX.value}% ${frameY.value}%`)
const previewVideoStyle = computed(() => ({
  objectPosition: frameObjectPosition.value,
  objectFit: orientation.value === 'horizontal' ? 'contain' : 'cover',
}))
const orientationLabel = computed(() => orientation.value === 'vertical' ? t('goLive.vertical') : t('goLive.horizontal'))

const tabButtonClass = (active: boolean) => [
  'rounded-full px-4 py-2 text-sm font-black transition',
  active ? 'bg-white text-black shadow' : 'text-gray-300 hover:bg-white/10 hover:text-white'
]

const orientationButtonClass = (active: boolean) => [
  'rounded-full px-3 py-1.5 text-xs font-black transition',
  active ? 'bg-red-600 text-white shadow shadow-red-950/40' : 'bg-white/10 text-gray-200 hover:bg-white/20'
]

const clampFrame = (value: number) => Math.min(100, Math.max(0, value))

const updateViewportSize = () => {
  if (typeof window === 'undefined') return
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
}

const resetFrame = () => {
  frameX.value = 50
  frameY.value = 50
}

const setOrientation = async (nextOrientation: 'vertical' | 'horizontal') => {
  if (inAppPublishing.value) return
  orientation.value = nextOrientation
  resetFrame()
  if (localStream.value && !inAppPublishing.value) {
    await startPreview()
  }
}

const beginFrameDrag = (event: PointerEvent) => {
  const target = event.target as HTMLElement
  if (target.closest('button,input,textarea,select,a')) return
  if (!localStream.value || !previewFrame.value) return
  event.preventDefault()
  previewFrame.value.setPointerCapture?.(event.pointerId)
  frameDragging.value = true
  frameDragStart.value = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    frameX: frameX.value,
    frameY: frameY.value,
  }
  window.addEventListener('pointermove', updateFrameDrag)
  window.addEventListener('pointerup', endFrameDrag, { once: true })
  window.addEventListener('pointercancel', endFrameDrag, { once: true })
}

const updateFrameDrag = (event: PointerEvent) => {
  if (!frameDragging.value || !previewFrame.value) return
  const rect = previewFrame.value.getBoundingClientRect()
  const start = frameDragStart.value
  const xDeltaPercent = ((event.clientX - start.x) / Math.max(rect.width, 1)) * 100
  const yDeltaPercent = ((event.clientY - start.y) / Math.max(rect.height, 1)) * 100
  frameX.value = clampFrame(start.frameX - xDeltaPercent)
  frameY.value = clampFrame(start.frameY - yDeltaPercent)
}

const endFrameDrag = () => {
  frameDragging.value = false
  if (previewFrame.value) {
    previewFrame.value.releasePointerCapture?.(frameDragStart.value.pointerId)
  }
  window.removeEventListener('pointermove', updateFrameDrag)
}

const chatOnlyPath = computed(() => {
  if (!selectedChannelId.value) return '/live-chat'
  return `/live-chat/${encodeURIComponent(selectedChannelId.value)}`
})

const loadChannels = () => {
  isLoggedIn.value = !!localStorage.getItem('user_id')
  if (!isLoggedIn.value) return

  const stored = localStorage.getItem('user_channels')
  if (!stored) return

  try {
    const parsed = JSON.parse(stored)
    channels.value = Array.isArray(parsed) ? parsed : []
  } catch {
    channels.value = []
  }

  if (channels.value.length > 0 && !selectedChannelId.value) {
    selectedChannelId.value = channels.value[0]?.id || ''
  }
}

const loadLiveState = async () => {
  if (!selectedChannelId.value) return
  message.value = ''

  try {
    live.value = await getMyLiveStream(selectedChannelId.value)
    title.value = live.value.title || t('goLive.defaultTitle')
    description.value = live.value.description || ''
    publisherPresenceEnabled.value = !!live.value.use_publisher_presence
    dvrEnabled.value = live.value.dvr_enabled !== false
  } catch (err: any) {
    error.value = true
    message.value = err?.response?.data?.error || t('goLive.loadError')
  }
}

const withAction = async (action: 'start' | 'stop' | 'rotate', fn: () => Promise<void>) => {
  saving.value = true
  pendingAction.value = action
  error.value = false
  message.value = ''
  try {
    await fn()
    await loadLiveState()
  } catch (err: any) {
    error.value = true
    message.value = err?.response?.data?.error || t('goLive.requestFailed')
  } finally {
    saving.value = false
    pendingAction.value = ''
  }
}

const startStream = async () => {
  await withAction('start', async () => {
    await startMyLiveStream(selectedChannelId.value, title.value, description.value, dvrEnabled.value)
    message.value = t('goLive.streamMarkedLive')
  })
}

const stopStream = async () => {
  await withAction('stop', async () => {
    await stopMyLiveStream(selectedChannelId.value)
    message.value = t('goLive.streamMarkedOffline')
  })
}

const rotateKey = async () => {
  await withAction('rotate', async () => {
    await rotateMyLiveStreamKey(selectedChannelId.value)
    message.value = t('goLive.streamKeyRotated')
  })
}

const saveSettings = async () => {
  if (!selectedChannelId.value) return
  savingSettings.value = true
  error.value = false
  message.value = ''
  try {
    await saveMyLiveStreamSettings(selectedChannelId.value, title.value, description.value, dvrEnabled.value)
    await loadLiveState()
    message.value = t('goLive.settingsSaved')
  } catch (err: any) {
    error.value = true
    message.value = err?.response?.data?.error || t('goLive.saveError')
  } finally {
    savingSettings.value = false
  }
}

const updatePublisherPresence = async () => {
  if (!selectedChannelId.value) return
  savingPublisherPresence.value = true
  try {
    await setMyPublisherPresence(selectedChannelId.value, publisherPresenceEnabled.value)
    await loadLiveState()
    error.value = false
    message.value = publisherPresenceEnabled.value
      ? t('goLive.publisherPresenceEnabled')
      : t('goLive.publisherPresenceDisabled')
  } catch (err: any) {
    error.value = true
    message.value = err?.response?.data?.error || t('goLive.publisherPresenceError')
  } finally {
    savingPublisherPresence.value = false
  }
}

const loadCameraDevices = async () => {
  if (!navigator.mediaDevices?.enumerateDevices) return
  const devices = await navigator.mediaDevices.enumerateDevices()
  cameraDevices.value = devices.filter(device => device.kind === 'videoinput')
  if (!selectedCameraId.value && cameraDevices.value.length) {
    selectedCameraId.value = cameraDevices.value[0]?.deviceId || ''
  }
}

const stopPreviewTracks = () => {
  localStream.value?.getTracks().forEach(track => track.stop())
  localStream.value = null
}

const stopPreviewVideoTracks = () => {
  localStream.value?.getVideoTracks().forEach(track => track.stop())
}

const stopPublishStream = () => {
  if (publishAnimationFrame) {
    cancelAnimationFrame(publishAnimationFrame)
    publishAnimationFrame = 0
  }
  publishStream.value?.getVideoTracks().forEach(track => track.stop())
  publishStream.value = null
}

const attachPreview = async () => {
  await nextTick()
  if (previewVideo.value && localStream.value) {
    previewVideo.value.srcObject = localStream.value
  }
}

const startPreview = async (options: { keepAudio?: boolean } = {}) => {
  if (!navigator.mediaDevices?.getUserMedia) {
    error.value = true
    message.value = t('goLive.cameraUnsupported')
    return
  }

  const existingStream = localStream.value
  const keptAudioTracks = options.keepAudio ? existingStream?.getAudioTracks() || [] : []
  const includeAudio = keptAudioTracks.length === 0

  try {
    const vertical = orientation.value === 'vertical'
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: includeAudio ? {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      } : false,
      video: {
        deviceId: selectedCameraId.value ? { exact: selectedCameraId.value } : undefined,
        facingMode: selectedCameraId.value ? undefined : { ideal: 'user' },
        width: { ideal: vertical ? 720 : 1280 },
        height: { ideal: vertical ? 1280 : 720 },
        frameRate: { ideal: 30, max: 30 },
      },
    })

    if (options.keepAudio) {
      stopPreviewVideoTracks()
      const nextAudioTracks = keptAudioTracks.length ? keptAudioTracks : stream.getAudioTracks()
      const nextStream = new MediaStream([
        ...stream.getVideoTracks(),
        ...nextAudioTracks,
      ])
      if (keptAudioTracks.length) {
        stream.getAudioTracks().forEach(track => track.stop())
      }
      localStream.value = nextStream
    } else {
      stopPreviewTracks()
      localStream.value = stream
    }

    await attachPreview()
    await loadCameraDevices()
    error.value = false
    message.value = ''
  } catch (err: any) {
    error.value = true
    message.value = err?.message || t('goLive.cameraPermissionDenied')
    throw err
  }
}

const refreshPreviewCamera = async () => {
  await startPreview({ keepAudio: inAppPublishing.value })
}

const switchCamera = async () => {
  if (cameraDevices.value.length < 2) return
  const index = cameraDevices.value.findIndex(device => device.deviceId === selectedCameraId.value)
  const next = cameraDevices.value[(index + 1) % cameraDevices.value.length]
  selectedCameraId.value = next?.deviceId || ''
  await startPreview({ keepAudio: inAppPublishing.value })
}

const waitForIceGatheringComplete = (pc: RTCPeerConnection) => {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 2500)
    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState === 'complete') {
        window.clearTimeout(timeout)
        resolve()
      }
    })
  })
}

const preferPeerConnectionVideoCodec = (pc: RTCPeerConnection, codecName: string) => {
  const capabilities = RTCRtpSender.getCapabilities?.('video')
  const codecs = capabilities?.codecs || []
  const targetMimeType = 'video/' + codecName.toLowerCase()
  const preferredCodecs = codecs.filter(codec => codec.mimeType.toLowerCase() === targetMimeType)
  if (!preferredCodecs.length) return

  const remainingCodecs = codecs.filter(codec => codec.mimeType.toLowerCase() !== targetMimeType)
  for (const transceiver of pc.getTransceivers()) {
    if (transceiver.sender.track?.kind !== 'video' || !transceiver.setCodecPreferences) continue
    try {
      transceiver.setCodecPreferences([...preferredCodecs, ...remainingCodecs])
    } catch (err) {
      console.warn('Unable to set live video codec preference:', err)
    }
  }
}

const preferVideoCodec = (sdp: string, codecName: string) => {
  const lines = sdp.split('\r\n')
  const videoMLineIndex = lines.findIndex(line => line.startsWith('m=video '))
  if (videoMLineIndex === -1) return sdp

  const codecPayloads = new Set<string>()
  const codecPattern = new RegExp('^a=rtpmap:(\\d+)\\s+' + codecName + '/', 'i')
  for (const line of lines) {
    const match = line.match(codecPattern)
    if (match?.[1]) codecPayloads.add(match[1])
  }
  if (codecPayloads.size === 0) return sdp

  const parts = lines[videoMLineIndex].split(' ')
  const header = parts.slice(0, 3)
  const payloads = parts.slice(3)
  const preferred = payloads.filter(payload => codecPayloads.has(payload))
  const rest = payloads.filter(payload => !codecPayloads.has(payload))
  lines[videoMLineIndex] = [...header, ...preferred, ...rest].join(' ')
  return lines.join('\r\n')
}

const waitForPeerConnectionReady = (pc: RTCPeerConnection) => {
  if (pc.connectionState === 'connected' || pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error(t('goLive.liveConnectionTimedOut')))
    }, 10000)

    const check = () => {
      if (pc.connectionState === 'failed' || pc.iceConnectionState === 'failed') {
        cleanup()
        reject(new Error(t('goLive.liveConnectionFailed')))
        return
      }
      if (pc.connectionState === 'connected' || pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        cleanup()
        resolve()
      }
    }

    const cleanup = () => {
      window.clearTimeout(timeout)
      pc.removeEventListener('connectionstatechange', check)
      pc.removeEventListener('iceconnectionstatechange', check)
    }

    pc.addEventListener('connectionstatechange', check)
    pc.addEventListener('iceconnectionstatechange', check)
    check()
  })
}

const createFramedPublishStream = async () => {
  if (!localStream.value) await startPreview()
  if (!localStream.value || !previewVideo.value) throw new Error(t('goLive.cameraNotReady'))

  stopPublishStream()

  const vertical = orientation.value === 'vertical'
  const canvas = document.createElement('canvas')
  canvas.width = vertical ? 720 : 1280
  canvas.height = vertical ? 1280 : 720
  const context = canvas.getContext('2d')
  if (!context) throw new Error(t('goLive.cameraFrameError'))

  const drawFrame = () => {
    const video = previewVideo.value
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      publishAnimationFrame = requestAnimationFrame(drawFrame)
      return
    }

    const sourceWidth = video.videoWidth || canvas.width
    const sourceHeight = video.videoHeight || canvas.height
    const scale = Math.max(canvas.width / sourceWidth, canvas.height / sourceHeight)
    const drawWidth = sourceWidth * scale
    const drawHeight = sourceHeight * scale
    const extraX = Math.max(0, drawWidth - canvas.width)
    const extraY = Math.max(0, drawHeight - canvas.height)
    const drawX = -extraX * (frameX.value / 100)
    const drawY = -extraY * (frameY.value / 100)

    context.fillStyle = '#000'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(video, drawX, drawY, drawWidth, drawHeight)
    publishAnimationFrame = requestAnimationFrame(drawFrame)
  }

  drawFrame()
  const stream = canvas.captureStream(30)
  localStream.value.getAudioTracks().forEach(track => stream.addTrack(track))
  publishStream.value = stream
  return stream
}

const liveAuthHeaders = () => {
  const userID = typeof window !== "undefined" ? localStorage.getItem("user_id") : ""
  return userID ? { "X-User-ID": userID } : {}
}

const liveWhipProxyURL = () => `/api/v1/live/me/whip?channel_id=${encodeURIComponent(selectedChannelId.value)}`

const publishWhip = async () => {
  if (!localStream.value) await startPreview()
  const stream = await createFramedPublishStream()

  const whipURL = liveWhipProxyURL()
  if (!selectedChannelId.value) throw new Error(t('goLive.channelRequired'))

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  })
  stream.getTracks().forEach(track => {
    pc.addTrack(track, stream)
  })
  preferPeerConnectionVideoCodec(pc, 'H264')

  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  await waitForIceGatheringComplete(pc)

  const response = await fetch(whipURL, {
    method: 'POST',
    headers: {
      ...liveAuthHeaders(),
      'Content-Type': 'application/sdp',
      Accept: 'application/sdp',
    },
    body: preferVideoCodec(pc.localDescription?.sdp || offer.sdp || '', 'H264'),
  })

  if (!response.ok) {
    pc.close()
    throw new Error(t('goLive.whipPublishFailed', { status: response.status }))
  }

  const location = response.headers.get('Location')
  if (location) {
    const publicWhipURL = typeof window !== 'undefined' ? new URL(whipURL, window.location.origin).toString() : whipURL
    const resourceURL = new URL(location, publicWhipURL)
    if (typeof window !== 'undefined' && resourceURL.origin !== window.location.origin) {
      whipResourceUrl.value = new URL(`${resourceURL.pathname}${resourceURL.search}${resourceURL.hash}`, window.location.origin).toString()
    } else {
      whipResourceUrl.value = resourceURL.toString()
    }
  }

  const answer = await response.text()
  await pc.setRemoteDescription({ type: 'answer', sdp: answer })
  peerConnection.value = pc
  await waitForPeerConnectionReady(pc)
}

const beginInAppLive = async (nextOrientation: 'vertical' | 'horizontal') => {
  orientation.value = nextOrientation
  if (mustRotateForHorizontal.value) {
    error.value = true
    message.value = t('goLive.turnPhoneBeforeStarting')
    return
  }

  publishing.value = true
  error.value = false
  message.value = ''

  try {
    await saveMyLiveStreamSettings(selectedChannelId.value, title.value, description.value, dvrEnabled.value)
    await loadLiveState()
    await startPreview()
    await publishWhip()
    await startMyLiveStream(selectedChannelId.value, title.value, description.value, dvrEnabled.value)
    inAppPublishing.value = true
    await loadLiveState()
    startChatPolling()
    message.value = t('goLive.browserLiveStarted')
  } catch (err: any) {
    await cleanupWhip()
    error.value = true
    message.value = err?.message || t('goLive.inAppStartFailed')
  } finally {
    publishing.value = false
  }
}

const cleanupWhip = async () => {
  const resource = whipResourceUrl.value
  whipResourceUrl.value = ''
  if (resource) {
    try {
      await fetch(resource, { method: 'DELETE', headers: liveAuthHeaders() })
    } catch {
      // MediaMTX also closes the session when the peer connection closes.
    }
  }
  peerConnection.value?.close()
  peerConnection.value = null
  stopPublishStream()
}

const stopInAppLive = async () => {
  publishing.value = true
  error.value = false
  message.value = ''
  try {
    await cleanupWhip()
    await stopMyLiveStream(selectedChannelId.value)
    inAppPublishing.value = false
    stopChatPolling()
    await loadLiveState()
    message.value = t('goLive.browserLiveEnded')
  } catch (err: any) {
    error.value = true
    message.value = err?.response?.data?.error || err?.message || t('goLive.inAppStopFailed')
  } finally {
    publishing.value = false
  }
}

const leaveInAppStreamer = async () => {
  if (publishing.value) return

  if (inAppPublishing.value || peerConnection.value) {
    const shouldLeave = window.confirm(t('goLive.leaveEndsStreamConfirm'))
    if (!shouldLeave) return
    allowingStreamerLeave = true
    await stopInAppLive()
    if (inAppPublishing.value || peerConnection.value) {
      allowingStreamerLeave = false
      return
    }
  }

  stopPreviewTracks()

  if (window.history.length > 1) {
    router.back()
  } else {
    await navigateTo(localePath('/'))
  }
}

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!inAppPublishing.value && !peerConnection.value) return
  event.preventDefault()
  event.returnValue = t('goLive.leaveEndsStreamWarning')
}

onBeforeRouteLeave(async () => {
  if (allowingStreamerLeave) return true
  if (!inAppPublishing.value && !peerConnection.value) return true

  const shouldLeave = window.confirm(t('goLive.leaveEndsStreamConfirm'))
  if (!shouldLeave) return false

  allowingStreamerLeave = true
  await stopInAppLive()
  if (inAppPublishing.value || peerConnection.value) {
    allowingStreamerLeave = false
    return false
  }
  stopPreviewTracks()
  return true
})

const refreshChat = async () => {
  if (!selectedChannelId.value) return
  try {
    chatMessages.value = await getLiveChatMessages(selectedChannelId.value, 80)
    await nextTick()
    if (chatListRef.value) {
      chatListRef.value.scrollTop = chatListRef.value.scrollHeight
    }
    if (mobileChatListRef.value) {
      mobileChatListRef.value.scrollTop = mobileChatListRef.value.scrollHeight
    }
  } catch (err) {
    console.error('Failed to refresh live chat:', err)
  }
}

const startChatPolling = () => {
  stopChatPolling()
  refreshChat()
  chatPollTimer = setInterval(refreshChat, 3000)
}

const stopChatPolling = () => {
  if (chatPollTimer) {
    clearInterval(chatPollTimer)
    chatPollTimer = null
  }
}

const sendChatMessage = async () => {
  if (!canSendChat.value) return
  chatSending.value = true
  chatError.value = ''
  try {
    await postLiveChatMessage(selectedChannelId.value, selectedChannelId.value, chatInput.value.trim())
    chatInput.value = ''
    await refreshChat()
  } catch (err: any) {
    chatError.value = err?.response?.data?.error || t('goLive.chatSendFailed')
  } finally {
    chatSending.value = false
  }
}

const copyValue = async (value: string) => {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    error.value = false
    message.value = t('goLive.copied')
  } catch {
    error.value = true
    message.value = t('goLive.copyError')
  }
}

const formatDate = (value: string) => new Date(value).toLocaleString()

const openChatPopup = () => {
  if (!selectedChannelId.value) return
  const popup = window.open(
    chatOnlyPath.value,
    'giltube-live-chat',
    'popup=yes,width=420,height=760,resizable=yes,scrollbars=yes'
  )
  if (!popup) {
    window.open(chatOnlyPath.value, '_blank', 'noopener')
  }
}

watch(selectedChannelId, async (channelID) => {
  if (!channelID) return
  await loadLiveState()
  chatMessages.value = []
})

watch(activeTab, async (tab) => {
  if (tab === 'in-app' && localStream.value) {
    await attachPreview()
  }
})

onMounted(async () => {
  updateViewportSize()
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('resize', updateViewportSize)
  window.addEventListener('orientationchange', updateViewportSize)
  loadChannels()
  await loadCameraDevices()
  if (selectedChannelId.value) {
    await loadLiveState()
  }
})

onBeforeUnmount(async () => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('resize', updateViewportSize)
  window.removeEventListener('orientationchange', updateViewportSize)
  stopChatPolling()
  await cleanupWhip()
  stopPreviewTracks()
})
</script>

<style scoped>
@media (max-width: 1023px) {
  .mobile-in-app-live {
    min-height: 100dvh;
    overflow: hidden;
  }

  .in-app-live-stage {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: block;
    width: 100vw;
    height: 100dvh;
    background: #000;
  }

  .mobile-live-preview-shell {
    width: 100%;
    height: 100%;
    min-height: 100dvh;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .mobile-live-preview-frame {
    width: 100% !important;
    height: 100% !important;
    min-height: 100dvh;
    max-width: none !important;
    max-height: none;
    aspect-ratio: auto !important;
  }

  .mobile-preview-video {
    object-fit: contain !important;
  }

  .mobile-live-back-button {
    top: calc(env(safe-area-inset-top) + 0.75rem);
  }

  .mobile-live-status-pills {
    top: calc(env(safe-area-inset-top) + 4rem);
  }

  @media (orientation: landscape) {
    .mobile-live-landscape .mobile-live-controls-overlay {
      top: 0;
      display: grid;
      grid-template-columns: minmax(15rem, 0.95fr) minmax(14rem, 0.9fr);
      align-items: end;
      gap: 1rem;
      background:
        linear-gradient(90deg, rgba(0, 0, 0, 0.74), rgba(0, 0, 0, 0.18) 42%, rgba(0, 0, 0, 0.62)),
        linear-gradient(0deg, rgba(0, 0, 0, 0.55), transparent 52%);
      padding-top: calc(env(safe-area-inset-top) + 4.5rem);
    }

    .mobile-live-landscape .mobile-live-control-stack {
      grid-column: 1;
      min-width: 0;
      max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 5.5rem);
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .mobile-live-landscape .mobile-live-chat-overlay {
      grid-column: 2;
      align-self: end;
      margin: 0;
      max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 5.5rem);
      min-height: 7rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1.25rem;
      background: rgba(0, 0, 0, 0.38);
      padding: 0.6rem;
      backdrop-filter: blur(14px);
    }

    .mobile-live-landscape .mobile-live-chat-overlay > div {
      max-width: 100%;
      margin-left: auto;
    }

    .mobile-live-landscape .mobile-live-action-bar {
      align-items: flex-start;
    }

    .mobile-live-landscape .mobile-live-action-bar button {
      padding-inline: 0.85rem;
    }
  }
}
</style>
