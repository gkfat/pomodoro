<script setup lang="ts">
const commit = __APP_COMMIT__;
const buildDate = __APP_BUILD_DATE__;
</script>

<template>
    <div class="text-caption text-medium-emphasis text-center">
        {{ commit }} · {{ buildDate }}
    </div>
</template>
