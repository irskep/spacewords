import { StarSystem } from 'stellardream';
import Alea from 'alea';
import Improv from 'improv';

import starnames from './starnames';
import starGrammar from './improvgrammar/star.yaml';

function patchingMathDotRandom(fn, code) {
  const oldMR = Math.random;
  Math.random = fn;
  code();
  Math.random = oldMR;  
}

const generator = new Improv(starGrammar, {
  filters: [Improv.filters.mismatchFilter()],
  reincorporate: true,
});

export default class LiterateStarSystem {
  constructor(seed) {
    this.seed = seed || Date.now();
    this.starSystem = new StarSystem(this.seed);
    this.alea = new Alea(this.seed);

    patchingMathDotRandom(this.alea, () => {
      this.name = starnames.flatten('#starname#');
    });

    this.text = generator.gen('root', {});
  }
}