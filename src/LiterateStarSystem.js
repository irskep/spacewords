import { StarSystem } from 'stellardream';
import Alea from 'alea';
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
    const improvModel = this.makeImprovModel();

    this.systemText = starSystemTextGenerator.gen('root', improvModel);

    /* planet model + text */

    const { planetImprovModels, lifePlanets, lifePlanetIndex } = this.makePlanetModels(improvModel, planets);

    /* life */

    for (let m of planetImprovModels) {
      m.tags.push(['isNamed', `${lifePlanets.length > 0}`]);
    }

    if (lifePlanetIndex >= 0) {
      this.hasLife = true;
      this.lifePlanetName = lifePlanets[lifePlanetIndex].planetImprovModel.planetName;
      this.lifeTexts = this.makeLifeText(lifePlanets, lifePlanetIndex, lifeTextGenerator);
    } else {
      this.hasLife = false;
      this.lifeTexts = [noLifeTextGenerator.gen('root', improvModel)];
    }

    this.planetTexts = this.makePlanetTexts(lifePlanetIndex, lifePlanets, planetTextGenerator, planetImprovModels);

    console.log('system', improvModel);

    // for (let i=0; i<100; i++) {
    //   console.log(speciesnames.flatten('#root#'));
    // }
  }

  makeImprovModel() {
    /* values */
    const planets = this.starSystem.planets;
    let planetMinAU = 0;
    let planetMaxAU = 0;
    if (planets.length) {
      planetMinAU = precision(2, planets[0].distance);
      planetMaxAU = precision(2, planets[planets.length - 1].distance);
    }
    let planetsAmount = 'none';
    if (planets.length == 1)
      planetsAmount = 'one';
    if (planets.length > 1)
      planetsAmount = 'many';

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

    return {
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
      ].concat(star2tags(this.starSystem)),
      numberword: numberToWords.toWords,
      ordinal: numberToWords.toWordsOrdinal,
      num: (n) => parseInt(n, 10).toLocaleString(),
      precision2: (n) => parseFloat(parseFloat(n).toPrecision(2)),
    };
  }

  makeLifeText(lifePlanets, lifePlanetIndex, lifeTextGenerator) {
    const planetImprovModel = lifePlanets[lifePlanetIndex].planetImprovModel;
    lifePlanets.forEach((p, i) => {
      if (i === lifePlanetIndex) {
        return;
      }
      p.planetImprovModel.tags.push(['hasColonizablePlanet', 'true']);
      p.planetImprovModel.tags.push(['isColonized', 'false']);
      planetImprovModel.colonizablePlanetName = p.planetImprovModel.planetName;
    });
    if (lifePlanets.length > 1) {
      planetImprovModel.tags.push(['hasColonizablePlanet', 'true']);
      planetImprovModel.tags.push(['isColonized', 'true']);
    }
    else {
      planetImprovModel.tags.push(['hasColonizablePlanet', 'false']);
      planetImprovModel.tags.push(['isColonized', 'true']);
    }
    return lifeTextGenerator
      .gen('root', planetImprovModel)
      // .join('\n\n')
      .split('\n\n')
      .filter((i) => i);
  }

  makePlanetModels(improvModel, planets) {
    // TODO: order planets interestingly
    const originalTags = improvModel.tags;
    const lifePlanets = [];
    const planetImprovModels = [];
    let lifePlanetIndex = -1;

    for (let i = 0; i < planets.length; i++) {
      const planet = planets[i];
      planet.planetName = patchingMathDotRandom(this.alea, () => {
        return planetnames.flatten('#root#');
      });
      let pluralizedMoons = (`${planet.moons.length} ${pluralize('moon', planet.moons.length)}`);
      if (pluralizedMoons === '0 moons')
        pluralizedMoons = 'no moons';

      const planetImprovModel = Object.assign({}, improvModel, {
        tags: planet2tags(planet, this.starSystem.habitableZoneMin, this.starSystem.habitableZoneMax).concat(originalTags),
        planet: Object.assign({
          number: i + 1,
          pluralizedMoons,
          earthMasses: precision(2, planet.mass),
          jupiterMasses: precision(2, planet.mass / 10.96),
          neptuneMasses: precision(2, planet.mass / 3.86),
        }),
        nonLifeInhabitablePlanets: [],
      }, planet);
      planetImprovModels.push(planetImprovModel);

      const isHz = planet.distance >= this.starSystem.habitableZoneMin &&
        planet.distance <= this.starSystem.habitableZoneMax;
      if (isHz && planet.planetType === 'Terran') {
        // by end of loop, each habitable planet has a 1/n chance of being chosen.
        // TODO: prefer planets with moons
        if (this.alea() < 1 / (lifePlanets.length + 1)) {
          lifePlanetIndex = lifePlanets.length;
        }
        lifePlanets.forEach(({ planetImprovModel }) => {
          planetImprovModel.planet.colonizablePlanetName = planet.name;
        });
        lifePlanets.push({ planet, planetImprovModel });
      }
    }
    return { planetImprovModels, lifePlanets, lifePlanetIndex };
  }

  makePlanetTexts(lifePlanetIndex, lifePlanets, planetTextGenerator, planetImprovModels) {
    const planetTexts = [];
    if (lifePlanetIndex >= 0) {
      const m = lifePlanets[lifePlanetIndex].planetImprovModel;
      m.hasLife = true;
      m.alreadyGone = true;
      planetTexts.push({model: m, text: planetTextGenerator.gen('root', m)});
      console.log('planet', m.planetName, m);
    }
    planetImprovModels.forEach((m) => {
      if (m.alreadyGone) return;
      m.hasLife = false;
      planetTexts.push({model: m, text: planetTextGenerator.gen('root', m)});
      console.log('planet', m.planetName, m);
    });
    return planetTexts;
  }
}


