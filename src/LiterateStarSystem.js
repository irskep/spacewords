import { StarSystem } from 'stellardream';
import Alea from 'alea';
import Improv from 'improv';
import numberToWords from 'number-to-words';
import pluralize from 'pluralize';

import starnames from './tracerygrammar/starnames';
import planetnames from './tracerygrammar/planetnames';
import { patchingMathDotRandom, precision, choiceIndex, decimal, star2tags, planet2tags } from './util';
import makeImprovGenerators from './makeImprovGenerators';

export default class LiterateStarSystem {
  constructor(seed) {
    this.seed = seed || Date.now();
    this.starSystem = new StarSystem(this.seed);
    this.alea = new Alea(this.seed);

    this.name = patchingMathDotRandom(this.alea, () => {
      return starnames.flatten('#starname#');
    });

    /* tools */

    const {
      starSystemTextGenerator,
      lifeTextGenerator,
      noLifeTextGenerator,
      planetTextGenerator,
    } = makeImprovGenerators(this.alea);

    /* values */

    const planets = this.starSystem.planets;

    let planetMinAU = 0;
    let planetMaxAU = 0;
    if (planets.length) {
      planetMinAU = precision(2, planets[0].distance);
      planetMaxAU = precision(2, planets[planets.length - 1].distance);
    }

    let planetsAmount = 'none';
    if (planets.length == 1) planetsAmount = 'one';
    if (planets.length > 1) planetsAmount = 'many';

    /* system model + text */

    const speciesEndGa = precision(3, 0.2 + this.alea() * 3);
    const lifespanLength = ['short', 'medium', 'long'][choiceIndex(this.alea(), 3)];
    const lifespanMin = {
      short: 50000,
      medium: 100000,
      long: 500000,
    }[lifespanLength];
    const lifespanMax = {
      short: 100000,
      medium: 500000,
      long: 2000000,
    }[lifespanLength];
    const lifespanYears = Math.floor(lifespanMin + this.alea() * (lifespanMax - lifespanMin));
    const lifespanGa = decimal(2, lifespanYears / 1000000000);
    const speciesBeginGa = decimal(2, speciesEndGa - lifespanGa);
    const lifeBeginGa = decimal(2, speciesBeginGa + 1 + this.alea() * 3);

    const improvModel = {
      // starSystem: this.starSystem,
      name: this.name,
      numPlanets: planets.length,
      planetMinAU,
      planetMaxAU,
      lifeBeginTime: `${lifeBeginGa} billion years ago`,
      speciesBeginTime: `${speciesBeginGa} billion years ago`,
      speciesEndTime: `${speciesEndGa} billion years ago`,
      lifespanYears: lifespanYears,

      tags: [
        ['planetsAmount', planetsAmount],
        ['lifespanLength', lifespanLength]
      ].concat(
        star2tags(this.starSystem)
      ),

      numberword: numberToWords.toWords,
      ordinal: numberToWords.toWordsOrdinal,
      num: (n) => parseInt(n, 10).toLocaleString(),
      precision2: (n) => parseFloat(parseFloat(n).toPrecision(2)),
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
            earthMasses: precision(2, planet.mass),
            jupiterMasses: precision(2, planet.mass / 10.96),
            neptuneMasses: precision(2, planet.mass / 3.86),
          }),
          nonLifeInhabitablePlanets: [],
        },
        planet);
      planetImprovModels.push(planetImprovModel);

      const isHz = planet.distance >= this.starSystem.habitableZoneMin &&
        planet.distance <= this.starSystem.habitableZoneMax;
      if (isHz && planet.planetType === 'Terran') {
        // by end of loop, each habitable planet has a 1/n chance of being chosen.
        // TODO: prefer planets with moons
        if (this.alea() < 1 / (lifePlanets.length + 1)) {
          lifePlanetIndex = lifePlanets.length;
        }
        lifePlanets.forEach(({planetImprovModel}) => {
          planetImprovModel.planet.colonizablePlanetName = planet.name;
        });
        lifePlanets.push({planet, planetImprovModel});
      }
    }

    /* life */

    for (let m of planetImprovModels) {
      m.tags.push(['isNamed', `${lifePlanets.length > 0}`]);
    }

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

    if (lifePlanetIndex >= 0) {
      const m = lifePlanets[lifePlanetIndex].planetImprovModel;
      m.alreadyGone = true;
      this.planetTexts.push(planetTextGenerator.gen('root', m));
      console.log('planet', m.planetName, m);
    }

    planetImprovModels.forEach((m) => {
      if (m.alreadyGone) return;
      this.planetTexts.push(planetTextGenerator.gen('root', m));
      console.log('planet', m.planetName, m);
    });

    console.log('system', improvModel);

    // for (let i=0; i<100; i++) {
    //   console.log(speciesnames.flatten('#root#'));
    // }
  }
}


