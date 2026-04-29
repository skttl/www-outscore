<script setup lang="ts">
import { useInstallPrompt } from '~/composables/useInstallPrompt'

const { shouldShow, isIOS, iosBrowser, promptInstall, dismiss } = useInstallPrompt()
const { t } = useI18n()

const iosStep1Text = computed(() =>
  iosBrowser.value
    ? t('install.iosStep1', { browser: iosBrowser.value })
    : t('install.iosStep1Generic'),
)

const showIOSInstructions = ref(false)

async function onInstall() {
  if (isIOS.value) {
    showIOSInstructions.value = true
  } else {
    await promptInstall()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="shouldShow && !showIOSInstructions"
        class="fixed inset-x-0 bottom-0 z-40 px-3 pb-3"
        style="padding-bottom: calc(env(safe-area-inset-bottom) + 0.75rem);"
      >
        <div class="mx-auto max-w-md rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-xl p-3 flex items-center gap-3">
          <div class="text-3xl shrink-0">🎯</div>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-sm">{{ t('install.title') }}</div>
            <div class="text-xs text-[var(--color-muted)]">{{ t('install.subtitle') }}</div>
          </div>
          <button
            type="button"
            class="px-3 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-bold text-sm active:scale-95 shrink-0"
            @click="onInstall"
          >
            {{ t('install.action') }}
          </button>
          <button
            type="button"
            class="w-8 h-8 rounded-full text-[var(--color-muted)] active:scale-95 shrink-0"
            :aria-label="t('common.close')"
            @click="dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </Transition>

    <!-- iOS instructions modal -->
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showIOSInstructions"
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end"
        @click.self="showIOSInstructions = false"
      >
        <div
          class="w-full bg-[var(--color-surface)] rounded-t-3xl border-t border-[var(--color-border)] p-5 pb-8"
          style="padding-bottom: calc(env(safe-area-inset-bottom) + 1.5rem);"
        >
          <div class="w-12 h-1.5 bg-[var(--color-border)] rounded-full mx-auto mb-4" />
          <h2 class="text-lg font-bold mb-3">📱 {{ t('install.iosTitle') }}</h2>
          <ol class="text-sm space-y-3 text-[var(--color-text)]">
            <li class="flex gap-3">
              <span class="w-6 h-6 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-bold flex items-center justify-center shrink-0">1</span>
              <span>{{ iosStep1Text }} <span class="inline-block px-1.5 py-0.5 bg-[var(--color-surface-2)] rounded">⎙</span></span>
            </li>
            <li class="flex gap-3">
              <span class="w-6 h-6 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-bold flex items-center justify-center shrink-0">2</span>
              <span>{{ t('install.iosStep2') }}</span>
            </li>
            <li class="flex gap-3">
              <span class="w-6 h-6 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-bold flex items-center justify-center shrink-0">3</span>
              <span>{{ t('install.iosStep3') }}</span>
            </li>
          </ol>
          <div class="flex gap-2 mt-5">
            <button
              type="button"
              class="flex-1 h-11 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] active:scale-95"
              @click="showIOSInstructions = false; dismiss()"
            >
              {{ t('common.close') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
