import { StarSystem } from 'stellardream';
import Alea from 'alea';
import Improv from 'improv';
import numberToWords from 'number-to-words';
import pluralize from 'pluralize';

import starnames from './tracerygrammar/starnames';
import speciesnames from './tracerygrammar/speciesnames';
import starSystemGrammar from './improvgrammar/starSystem.yaml';
import planetGrammar from './improvgrammar/planet.yaml';

function patchingMathDotRandom(fn, code) {
  const oldMR = Math.random;
  Math.random = fn;
  code();
  Math.random = oldMR;  
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
  ]
}

export default class LiterateStarSystem {
  constructor(seed) {
    this.seed = seed || Date.now();
    this.starSystem = new StarSystem(this.seed);
    this.alea = new Alea(this.seed);

    patchingMathDotRandom(this.alea, () => {
      this.name = starnames.flatten('#starname#');
    });

    /* tools */

    const starSystemTextGenerator = new Improv(starSystemGrammar, {
      filters: [
        Improv.filters.mismatchFilter(),
        Improv.filters.partialBonus(),
        Improv.filters.fullBonus(),
        Improv.filters.dryness(),
        ],
      reincorporate: true,
      audit: true,
      persistence: false,
    });

    const planetTextGenerator = new Improv(planetGrammar, {
      filters: [
        Improv.filters.mismatchFilter(),
        Improv.filters.partialBonus(),
        Improv.filters.fullBonus(),
        Improv.filters.dryness(),
        ],
      reincorporate: true,
      audit: true,
      persistence: false,
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
    };

    this.systemText = starSystemTextGenerator.gen('root', improvModel);

    /* planet model + text */

    // TODO: order planets interestingly
    this.planetTexts = [];
    const originalTags = improvModel.tags;

    for (let i=0; i<planets.length; i++) {
      const planet = planets[i];

      const isHz = planet.distance >= this.starSystem.habitableZoneMin &&
        planet.distance <= this.starSystem.habitableZoneMax;

      let speciesName = '';
      patchingMathDotRandom(this.alea, () => {
        speciesName = speciesnames.flatten('#root#');
      });

      let pluralizedMoons = (
        `${planet.moons.length} ${pluralize('moon', planet.moons.length)}`);
      if (pluralizedMoons === '0 moons') pluralizedMoons = 'no moons';

      improvModel.tags = planet2tags(
        planet, this.starSystem.habitableZoneMin, this.starSystem.habitableZoneMax
      ).concat(originalTags)
      improvModel.planet = Object.assign({
        number: i + 1,
        pluralizedMoons,
        speciesName,
        earthMasses: planet.mass.toPrecision(2),
      }, planet);

      this.planetTexts.push(planetTextGenerator.gen('root', improvModel));
    }
    console.log(this);

    for (let i=0; i<100; i++) {
      console.log(speciesnames.flatten('#root#'));
    }
  }
}