<template>
  <!-- Don't drop "q-app" class -->
  <div id="q-app">
    <router-view />
  </div>
</template>

<script>
/*
 * Root component
 */
import {QAjaxBar} from 'quasar'
export default {
  components: {
    QAjaxBar
  }
}
</script>

<style></style>
