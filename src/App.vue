<template>
  <main>
    <article v-if="!system">
      <h1>Space Words</h1>
      <h2>by <a href="https://steveasleep.com">Steve Landey</h2>

      <p>
        The <a href="https://en.wikipedia.org/wiki/Drake_equation">Drake equation</a> suggests that life in the universe ought to be fairly
        abundant. But even if it is, the limits of lightspeed and the cosmic
        time scale make it effectively impossible for two sentient species
        to meet.
      </p>

      <p>
        This project imagines that you are an immortal being with infinite
        patience, traveling between stars at lightspeed, with the ability to
        read the history of each star system perfectly.
      </p>

      <p>
        The <i>Travel</i> button takes you to a random star system. Because 
        most star systems cannot support life, that means you'll rarely come
        across anything interesting. The <i>Search for life</i> button
        guarantees that life once existed in the system you visit.
      </p>
    </article>

    <nav>
      <div>
        Visited {{ traveledSystemsCount }} {{ traveledSystemsCount == 1 ? 'system' : 'systems' }}
      </div>
      <button @click="travel">Travel</button>
      <button @click="search">Search for life</button>
      <button v-if="!isStopped">Stop</button>
    </nav>

    <article v-if="system">
      <div class="GraphicalStar">
        <div class="GraphicalStar__Content">
          <div
            class="GraphicalStar__Graphic"
            v-bind:style="{ backgroundColor: system.starSystem.stars[0].color }"></div>
        </div>
      </div>

      <h1>{{ system.name }}</h1>

      <p>
        <a target="_blank" :href="keplverseURL">View in telescope</a>
      </p>

      <p>{{ system.systemText }}</p>

      <section v-for="(planetText, i) in system.planetTexts" v-bind:key="i">
        <div class="GraphicalPlanet">
          <div class="GraphicalPlanet__Content">
            <div
              class="GraphicalPlanet__Graphic"
              v-bind:class="{ [planetText.model.planetType]: planetText.model.planetType, hasLife: planetText.model.hasLife }"></div>
            <div class="GraphicalPlanet__Name" v-if="system.hasLife">
              {{ planetText.model.planetName }}
            </div>
            <div class="GraphicalPlanet__Name" v-if="!system.hasLife">
              #{{ planetText.model.planet.number }}
            </div>
          </div>
        </div>
        <p>
          {{ planetText.text }}
        </p>
      </section>

      <section v-if="system.hasLife">
        <h2>Life on {{ system.lifePlanetName }}</h2>
        <p v-for="(t, i) in system.lifeTexts" v-bind:key="i">{{ t }}</p>
      </section>

      <section v-if="!system.hasLife">
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
        <a href="http://www.tracery.io/">Tracery</a> for generating names.
      </div>

      <div>
        The
        <a href="https://www.cooperhewitt.org/open-source-at-cooper-hewitt/cooper-hewitt-the-typeface-by-chester-jenkins/">
          Cooper Hewitt
        </a>
        typeface.
      </div>

      <div>
        <a href="https://petermulvey.bandcamp.com/track/vlad-the-astrophysicist">
          Vlad the Astrophysicist
        </a>
        for inspiration.
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
    const keplverseURL = computed(() => `https://steveasleep.com/keplverse/#seed=${ seed.value }`);

    const system = ref(null);
    const systemText = ref(null);
    const traveledSystemsCount = ref(parseInt(localStorage.traveledSystemsCount || '0', 10) || 0);

    // While traveling, may visit many systems without stopping
    const isStopped = ref(true);
    function stop() { isStopped.value = true; }

    function deriveSystem(inc) {
      system.value = new LiterateStarSystem(seed.value);
      if (inc) {
        traveledSystemsCount.value += 1;
        localStorage.traveledSystemsCount = `${traveledSystemsCount.value}`;
      }
      window.location.hash = `seed=${seed.value}`;
    }

    function travel() {
      seed.value = Date.now();
      console.log("Traveling to", seed.value);
      deriveSystem(true);
    }

    function _iterateSearch(baseSeed) {
      if (isStopped.value) {
        seed.value = baseSeed;
        deriveSystem(true);
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
        deriveSystem(true);
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
        deriveSystem(false);
      // } else {
      //   travel();
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
      keplverseURL,
    }
  }
}
</script>