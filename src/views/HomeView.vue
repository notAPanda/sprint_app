<script setup lang="ts">
import { Button } from '@/components/ui/button';
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
    <div class="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm ring-1 ring-slate-200/60">
      <div class="space-y-6">
        <div>
          <p class="text-sm uppercase tracking-[0.24em] text-sky-600">Sprint App</p>
          <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Get ready for video mode
          </h1>
          <p class="mt-4 text-base leading-7 text-slate-600">
            Follow these instructions before clicking through to the camera view.
          </p>
        </div>

        <ol class="space-y-4 text-slate-700">
          <li>
            <strong class="text-slate-900">1. Click “Video mode”.</strong>
            Allow the app to access your camera.
          </li>
          <li>
            <strong class="text-slate-900">2. Wait until everything loads.</strong>
            Make sure the camera and detector are ready before you start.
          </li>
          <li>
            <strong class="text-slate-900">3. Place the camera next to the person</strong>
            who will start from the block.
          </li>
          <li>
            <strong class="text-slate-900">4. Position yourself perpendicular to the direction of running.</strong>
            Set the camera level with the person’s starting position.
          </li>
          <li>
            <strong class="text-slate-900">5. Watch the guidance lines.</strong>
            If the person has optimal position, the lines will turn green
            (app looks for 103° and 140° in the knees)
          </li>
        </ol>

        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-slate-500">
            When the camera position is correct, the app will show green lines.
          </p>
          <Button as-child>
            <RouterLink to="/video">Enter video mode</RouterLink>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
