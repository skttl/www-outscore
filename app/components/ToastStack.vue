<script setup lang="ts">
import { useToasts } from '~/composables/useToast'

const { toasts } = useToasts()
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-x-0 top-2 z-[60] flex flex-col items-center gap-2 px-3">
      <TransitionGroup
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="[
            'pointer-events-auto rounded-xl px-4 py-3 shadow-lg max-w-md w-full text-sm font-medium border',
            t.variant === 'success'
              ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40'
              : t.variant === 'danger'
                ? 'bg-rose-500/15 text-rose-200 border-rose-500/40'
                : t.variant === 'warning'
                  ? 'bg-amber-500/15 text-amber-100 border-amber-500/40'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text)] border-[var(--color-border)]',
          ]"
        >
          {{ t.text }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
