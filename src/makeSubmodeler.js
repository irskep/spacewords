import speciesnames from './tracerygrammar/speciesnames';
import planetnames from './tracerygrammar/planetnames';
import { patchingMathDotRandom } from './util';

export function makeSubmodeler(alea) {
  return (supermodel, name) => {
    return patchingMathDotRandom(alea, () => {
      if (name.startsWith('>planetName')) {
        return { output: planetnames.flatten('#root#') };
      }
      if (name.startsWith('>speciesName')) {
        return { output: speciesnames.flatten('#root#') };
      }
      return {};
    });
  };
}
