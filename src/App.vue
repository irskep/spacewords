<template>
  <main>
    <nav>
      <div>
        Visited {{ traveledSystemsCount }} {{ traveledSystemsCount == 1 ? 'system' : 'systems' }}
      </div>
      <button @click="travel">Travel</button>
      <button @click="search">Search for life</button>
      <button v-if="!isStopped">Stop</button>
    </nav>

    <article v-if="system">
      <h1>{{ system.name }}</h1>
      <p>{{ system.systemText }}</p>

      <section v-for="(planetText, i) in system.planetTexts" v-bind:key="i">
        <p>{{ planetText }}</p>
      </section>

      <section>
        <h2>Life</h2>
        <p v-for="(t, i) in system.lifeTexts" v-bind:key="i">{{ t }}</p>
      </section>
    </article>

    <!-- <pre>{{ systemJSON }}</pre> -->

    <footer>
      <strong>Tools used to make this site:</strong>

      <div>
        <a href="https://steveasleep.com/stellardream">Stellar Dream</a> for
        generating astronomically plausible star systems.
      </div>

      <div>
        <a href="https://improv.readthedocs.io/">Improv</a> for generating text
        based on world models.
      </div>

      <div>
        The
        <a href="https://www.cooperhewitt.org/open-source-at-cooper-hewitt/cooper-hewitt-the-typeface-by-chester-jenkins/">
          Cooper Hewitt
        </a>
        typeface.
      </div>
    </footer>
  </main>
</template>

<script>
import { ref, computed, onMounted } from '@vue/composition-api';
import queryString from 'query-string';
import { StarSystem } from 'stellardream';

import LiterateStarSystem from './LiterateStarSystem';

const defer = (fn) => {
  setTimeout(fn, 0);
};

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
    function stop() { isStopped.value = true; }

    function deriveSystem() {
      system.value = new LiterateStarSystem(seed.value);
      traveledSystemsCount.value += 1;
      window.location.hash = `seed=${seed.value}`;
    }

    function travel() {
      seed.value = Date.now();
      console.log("Traveling to", seed.value);
      deriveSystem();
    }

    function _iterateSearch(baseSeed) {
      if (isStopped.value) {
        seed.value = baseSeed;
        deriveSystem();
        return;
      }

      const batchSize = 13;
      const allowedStarTypes = {
        'K': true,
        'G': true,
        'F': true,
      }
      const minPlanets = 2;
      const starSystem = system.value;

      const success = (s) => {
        seed.value = s;
        console.log("Traveling to", seed.value);
        isStopped.value = true;
        deriveSystem();
        return;
      }

      for (let s=baseSeed; s<baseSeed+batchSize; s++) {
        const starSystem = new StarSystem(s);

        if (!allowedStarTypes[starSystem.stars[0].starType]) { continue; }

        if (starSystem.planets.length < minPlanets) { continue; }

        for (let planet of starSystem.planets) {
          const isCold = planet.distance > starSystem.habitableZoneMax;
          const isHot = planet.distance < starSystem.habitableZoneMin;
          const isTidallyLocked = !isCold && starSystem.stars[0].starType == 'M';
          const isTerran = planet.planetType == 'Terran';

          if (isTerran && !isCold && !isHot && !isTidallyLocked) {
            success(s);
            return;
          }
        }
      }

      traveledSystemsCount.value += batchSize;
      defer(() => {
        _iterateSearch(baseSeed + batchSize);
      });
    }

    function search() {
      isStopped.value = false;
      _iterateSearch(Date.now());
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
      search,
      stop,
      isStopped,
    }
  }
}
</script>