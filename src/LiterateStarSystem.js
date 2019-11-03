import { StarSystem } from 'stellardream';
import Alea from 'alea';
import Improv from 'improv';
import numberToWords from 'number-to-words';

import starnames from './starnames';
import starGrammar from './improvgrammar/star.yaml';

function patchingMathDotRandom(fn, code) {
  const oldMR = Math.random;
  Math.random = fn;
  code();
  Math.random = oldMR;  
}

const generator = new Improv(starGrammar, {
  filters: [
    Improv.filters.mismatchFilter(),
    Improv.filters.partialBonus(),
    Improv.filters.fullBonus(),
    Improv.filters.dryness(),
    ],
  reincorporate: true,
  audit: true,
});

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

export default class LiterateStarSystem {
  constructor(seed) {
    this.seed = seed || Date.now();
    this.starSystem = new StarSystem(this.seed);
    this.alea = new Alea(this.seed);

    patchingMathDotRandom(this.alea, () => {
      this.name = starnames.flatten('#starname#');
    });

    const planets = this.starSystem.planets;

    let planetMinAU = 0;
    let planetMaxAU = 0;
    if (planets.length) {
      planetMinAU = planets[0].distance.toPrecision(2);
      planetMaxAU = planets[planets.length - 1].distance.toPrecision(2);
    }

    const improvModel = {
      starSystem: this.starSystem,
      name: this.name,
      numPlanets: planets.length,
      planetMinAU,
      planetMaxAU,

      tags: [
        ['hasPlanets', planets.length ? 'true' : 'false'],
      ].concat(
        star2tags(this.starSystem)
      ),

      numberword: numberToWords.toWords,
      ordinal: numberToWords.toWordsOrdinal,
    };

    console.log(improvModel);
    this.text = generator.gen('root', improvModel);
  }
}