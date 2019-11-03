<template>
  <div>
    <button @click="travel">Travel</button>
    <pre>{{ systemJSON }}</pre>
  </div>
</template>

<script>
import { ref, computed, onMounted } from '@vue/composition-api';
import { StarSystem } from 'stellardream';

export default {
  setup() {
    const system = ref(null);
    const traveledSystemsCount = ref(0);

    function travel() {
      system.value = new StarSystem(Date.now());
      traveledSystemsCount.value += 1;
    }

    onMounted(() => travel());

    return {
      system,
      systemJSON: computed(() => JSON.stringify(system.value, null, 2)),
      traveledSystemsCount,
      travel,
    }
  }
}
</script>