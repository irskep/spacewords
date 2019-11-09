import Improv from 'improv';
import starSystemGrammar from './improvgrammar/starSystem.yaml';
import planetGrammar from './improvgrammar/planet.yaml';
import noLifeGrammar from './improvgrammar/nolife.yaml';
import lifeGrammar from './improvgrammar/life.yaml';
import { makeSubmodeler } from './makeSubmodeler';

function dryness() {
  return function (group) {
    const self = this;
    const newPhrases = group.phrases.filter(function (phrase) {
      if (!phrase)
        return true;
      return self.history.indexOf(phrase) === -1;
    });
    const newGroup = Object.create(group);
    newGroup.phrases = newPhrases;
    return [0, newGroup];
  };
}

export default function makeImprovGenerators(alea) {
  const submodeler = makeSubmodeler(alea);

  const starSystemTextGenerator = new Improv(starSystemGrammar, {
    filters: [
      Improv.filters.mismatchFilter(),
      Improv.filters.partialBonus(),
      Improv.filters.fullBonus(),
    ],
    reincorporate: true,
    // audit: true,
    persistence: false,
    submodeler,
    rng: alea,
  });
  const planetTextGenerator = new Improv(planetGrammar, {
    filters: [
      Improv.filters.mismatchFilter(),
      Improv.filters.partialBonus(),
      Improv.filters.fullBonus(),
    ],
    reincorporate: true,
    // audit: true,
    persistence: false,
    submodeler,
    rng: alea,
  });
  const noLifeTextGenerator = new Improv(noLifeGrammar, {
    filters: [
      Improv.filters.mismatchFilter(),
      Improv.filters.partialBonus(),
      Improv.filters.fullBonus(),
    ],
    reincorporate: true,
    // audit: true,
    persistence: false,
    submodeler,
    rng: alea,
  });
  const lifeTextGenerator = new Improv(lifeGrammar, {
    filters: [
      Improv.filters.mismatchFilter(),
      Improv.filters.partialBonus(),
      Improv.filters.fullBonus(),
      dryness(),
    ],
    reincorporate: true,
    audit: true,
    persistence: false,
    submodeler,
    rng: alea,
  });
  return { starSystemTextGenerator, lifeTextGenerator, noLifeTextGenerator, planetTextGenerator };
}