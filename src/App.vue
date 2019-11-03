<template>
  <div>
    <button @click="travel">Travel</button>
    <h1 v-if="system">{{ system.name }}</h1>
    <pre>{{ systemJSON }}</pre>
  </div>
</template>

<script>
import { ref, computed, onMounted } from '@vue/composition-api';
import { StarSystem } from 'stellardream';
import queryString from 'query-string';
import starnames from './starnames';
import Alea from 'alea';

function patchingMathDotRandom(fn, code) {
  const oldMR = Math.random;
  Math.random = fn;
  code();
  Math.random = oldMR;  
}

class LiterateStarSystem {
  constructor(seed) {
    this.seed = seed || Date.now();
    this.starSystem = new StarSystem(this.seed);
    this.alea = new Alea(this.seed);

    patchingMathDotRandom(this.alea, () => {
      this.name = starnames.flatten('#starname#');
    });
  }
}

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