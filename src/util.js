export function patchingMathDotRandom(fn, code) {
  const oldMR = Math.random;
  Math.random = fn;
  const ret = code();
  Math.random = oldMR;
  return ret;
}
// 0-indexed
export function choiceIndex(randVal, outOf) {
  return Math.floor(randVal * outOf);
}
export function star2tags(starSystem) {
  if (starSystem.stars.length == 1) {
    return [
      ['numstars', '1'],
      ['star1type', starSystem.stars[0].starType],
    ];
  }
  else {
    return [
      ['numstars', '2'],
      ['star1type', starSystem.stars[0].starType],
      ['star2type', starSystem.stars[1].starType],
    ];
  }
}
export function planet2tags(planet, hzMin, hzMax) {
  let hz = 'cold';
  if (planet.distance < hzMin) {
    hz = 'hot';
  }
  else if (planet.distance < hzMax) {
    hz = 'habitable';
  }
  return [
    ['planetType', planet.planetType],
    ['hz', hz],
    ['hasMoons', `${planet.moons > 0}`],
  ];
}
export function precision(n, val) {
  return parseFloat(val.toPrecision(n));
}
export function decimal(n, val) {
  return parseFloat((Math.round(val * 100) / 100).toFixed(n));
}
