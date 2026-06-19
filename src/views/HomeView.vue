<script setup lang="ts">
import { Button } from '@/components/ui/button';
</script>

<template>
  <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
    <div class="my-10">
      <Button as-child>
          <RouterLink to="/video">Video mode</RouterLink>
      </Button>
    </div>
  </div>
</template>
