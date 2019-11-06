import { StarSystem } from 'stellardream';
import Alea from 'alea';
import Improv from 'improv';
import numberToWords from 'number-to-words';
import pluralize from 'pluralize';

import starnames from './tracerygrammar/starnames';
import speciesnames from './tracerygrammar/speciesnames';
import planetnames from './tracerygrammar/planetnames';
import starSystemGrammar from './improvgrammar/starSystem.yaml';
import planetGrammar from './improvgrammar/planet.yaml';
import noLifeGrammar from './improvgrammar/nolife.yaml';
import lifeGrammar from './improvgrammar/life.yaml';

function patchingMathDotRandom(fn, code) {
  const oldMR = Math.random;
  Math.random = fn;
  const ret = code();
  Math.random = oldMR;  
  return ret;
}

// 0-indexed
function choiceIndex(randVal, outOf) {
  return Math.floor(randVal * outOf);
}

function star2tags(starSystem) {
  if (starSystem.stars.length == 1) {
    return [
      ['numstars', '1'],
      ['star1type', starSystem.stars[0].starType],
    ];
  } else {
    return [
      ['numstars', '2'],
      ['star1type', starSystem.stars[0].starType],
      ['star2type', starSystem.stars[1].starType],
    ];
  }
}

function planet2tags(planet, hzMin, hzMax) {
  let hz = 'cold';
  if (planet.distance < hzMin) {
    hz = 'hot';
  } else if (planet.distance < hzMax) {
    hz = 'habitable';
  }
  return [
    ['planetType', planet.planetType],
    ['hz', hz],
    ['hasMoons', `${planet.moons > 0}`],
  ]
}

export default class LiterateStarSystem {
  constructor(seed) {
    this.seed = seed || Date.now();
    this.starSystem = new StarSystem(this.seed);
    this.alea = new Alea(this.seed);

    this.name = patchingMathDotRandom(this.alea, () => {
      return starnames.flatten('#starname#');
    });

    /* tools */

    const submodeler = (supermodel, name) => {
      return patchingMathDotRandom(this.alea, () => {
        if (name.startsWith('>planetName')) {
          return {output: planetnames.flatten('#root#')};
        }
        if (name.startsWith('>speciesName')) {
          return {output: speciesnames.flatten('#root#')};
        }
        return {}
      });
    };

    const starSystemTextGenerator = new Improv(starSystemGrammar, {
      filters: [
        Improv.filters.mismatchFilter(),
        Improv.filters.partialBonus(),
        Improv.filters.fullBonus(),
        // Improv.filters.dryness(),
        ],
      reincorporate: true,
      // audit: true,
      persistence: false,
      submodeler,
      rng: this.alea,
    });

    const planetTextGenerator = new Improv(planetGrammar, {
      filters: [
        Improv.filters.mismatchFilter(),
        Improv.filters.partialBonus(),
        Improv.filters.fullBonus(),
        // Improv.filters.dryness(),
        ],
      reincorporate: true,
      // audit: true,
      persistence: false,
      submodeler,
      rng: this.alea,
    });

    const noLifeTextGenerator = new Improv(noLifeGrammar, {
      filters: [
        Improv.filters.mismatchFilter(),
        Improv.filters.partialBonus(),
        Improv.filters.fullBonus(),
        // Improv.filters.dryness(),
        ],
      reincorporate: true,
      // audit: true,
      persistence: false,
      submodeler,
      rng: this.alea,
    });

    const lifeTextGenerator = new Improv(lifeGrammar, {
      filters: [
        Improv.filters.mismatchFilter(),
        // Improv.filters.partialBonus(),
        // Improv.filters.fullBonus(),
        // Improv.filters.dryness(),
        ],
      reincorporate: true,
      // audit: true,
      persistence: false,
      submodeler,
      rng: this.alea,
    });

    /* values */

    const planets = this.starSystem.planets;

    let planetMinAU = 0;
    let planetMaxAU = 0;
    if (planets.length) {
      planetMinAU = planets[0].distance.toPrecision(2);
      planetMaxAU = planets[planets.length - 1].distance.toPrecision(2);
    }

    let planetsAmount = 'none';
    if (planets.length == 1) planetsAmount = 'one';
    if (planets.length > 1) planetsAmount = 'many';

    /* system model + text */

    const improvModel = {
      // starSystem: this.starSystem,
      name: this.name,
      numPlanets: planets.length,
      planetMinAU,
      planetMaxAU,

      tags: [
        ['planetsAmount', planetsAmount],
      ].concat(
        star2tags(this.starSystem)
      ),

      numberword: numberToWords.toWords,
      ordinal: numberToWords.toWordsOrdinal,
      num: (n) => parseInt(n, 10).toLocaleString(),
    };

    this.systemText = starSystemTextGenerator.gen('root', improvModel);

    /* planet model + text */

    // TODO: order planets interestingly
    this.planetTexts = [];
    const originalTags = improvModel.tags;

    const lifePlanets = [];
    const planetImprovModels = [];
    let lifePlanetIndex = -1;

    for (let i=0; i<planets.length; i++) {
      const planet = planets[i];
      planet.planetName = patchingMathDotRandom(this.alea, () => {
        return planetnames.flatten('#root#');
      });

      let pluralizedMoons = (
        `${planet.moons.length} ${pluralize('moon', planet.moons.length)}`);
      if (pluralizedMoons === '0 moons') pluralizedMoons = 'no moons';

      const planetImprovModel = Object.assign({},
        improvModel,
        {
          tags: planet2tags(
            planet, this.starSystem.habitableZoneMin, this.starSystem.habitableZoneMax
          ).concat(originalTags),
          planet: Object.assign({
            number: i + 1,
            pluralizedMoons,
            earthMasses: planet.mass.toPrecision(2),
          }),
          nonLifeInhabitablePlanets: [],
        },
        planet);
      lifePlanets.forEach(({planetImprovModel}) => {
        planetImprovModel.planet.colonizablePlanetName = planet.name;
      });
      planetImprovModels.push(planetImprovModel);

      const isHz = planet.distance >= this.starSystem.habitableZoneMin &&
        planet.distance <= this.starSystem.habitableZoneMax;
      if (isHz && planet.planetType === 'Terran') {
        // by end of loop, each habitable planet has a 1/n chance of being chosen.
        // TODO: prefer planets with moons
        if (this.alea() < 1 / (lifePlanets.length + 1)) {
          lifePlanetIndex = lifePlanets.length;
        }
        lifePlanets.push({planet, planetImprovModel});
      }
    }

    /* life */

    if (lifePlanetIndex >= 0) {
      const planetImprovModel = lifePlanets[lifePlanetIndex].planetImprovModel;

      lifePlanets.forEach((p, i) => {
        if (i === lifePlanetIndex) { return; }
        p.planetImprovModel.tags.push(['hasColonizablePlanet', 'true']);
        p.planetImprovModel.tags.push(['isColonized', 'false']);
        planetImprovModel.colonizablePlanetName = p.planetImprovModel.planetName;
      })

      if (lifePlanets.length > 1) {
        planetImprovModel.tags.push(['hasColonizablePlanet', 'true']);
        planetImprovModel.tags.push(['isColonized', 'true']);
      } else {
        planetImprovModel.tags.push(['hasColonizablePlanet', 'false']);
        planetImprovModel.tags.push(['isColonized', 'true']);
      }

      for (let m of planetImprovModels) {
        m.tags.push(['isNamed', 'true']);
      }

      this.lifeTexts =  lifeTextGenerator
        .gen('root', planetImprovModel)
        // .join('\n\n')
        .split('\n\n')
        .filter((i) => i);

      console.log(this.lifeTexts);

    } else {
      console.log('lifeless', improvModel);
      this.lifeTexts = [noLifeTextGenerator.gen('root', improvModel)];
    }

    planetImprovModels.forEach((m) => {
      this.planetTexts.push(planetTextGenerator.gen('root', m));
      console.log('planet', m.planetName, m);
    });

    console.log('system', improvModel);

    // for (let i=0; i<100; i++) {
    //   console.log(speciesnames.flatten('#root#'));
    // }
  }
}