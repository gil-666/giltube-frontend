<script setup lang="ts">
const localePath = useLocalePath()

await navigateTo(localePath('/my-channels'), { replace: true })
</script>
