<template>
  <div>
    <button @click="travel">Travel</button>
    <div v-if="system">
      <h1>{{ system.name }}</h1>
      <p>{{ system.text }}</p>
    </div>

    <pre>{{ systemJSON }}</pre>
  </div>
</template>

<script>
import { ref, computed, onMounted } from '@vue/composition-api';
import LiterateStarSystem from './LiterateStarSystem';
import queryString from 'query-string';

export default {
  // 1572814796743
  setup() {
    const parsedHash = queryString.parse(window.location.hash);

    const seed = ref(null);
    const system = ref(null);
    const systemText = ref(null);
    const traveledSystemsCount = ref(0);

    // While traveling, may visit many systems without stopping
    const isStopped = ref(true);

    function deriveSystem() {
      system.value = new LiterateStarSystem(seed.value);
      traveledSystemsCount.value += 1;
      window.location.hash = `seed=${seed.value}`;
    }

    function travel() {
      seed.value = Date.now();
      deriveSystem();
    }

    onMounted(() => {
      if (parsedHash.seed && !isNaN(parseInt(parsedHash.seed, 10))) {
        seed.value = parseInt(parsedHash.seed, 10)
        console.log("Set seed:", seed.value);
      }
      if (seed.value) {
        deriveSystem();
      } else {
        travel();
      }
    });

    return {
      seed,
      system,
      systemJSON: computed(() => {
        if (!system.value) return "null";
        return JSON.stringify(system.value.starSystem, null, 2);
      }),
      traveledSystemsCount,
      travel,
    }
  }
}
</script>