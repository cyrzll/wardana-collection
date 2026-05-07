<script setup>
definePageMeta({
  middleware: [
    function (to, from) {
      return navigateTo('/admin/dashboard')
    },
  ],
})
</script>
