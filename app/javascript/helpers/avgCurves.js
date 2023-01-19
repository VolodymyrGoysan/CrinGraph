export default function avgCurves(curves) {
  return curves
    .map(c => c.map(d => Math.pow(10, d[1] / 20)))
    .reduce((as, bs) => as.map((a, i) => a + bs[i]))
    .map((x, i) => [curves[0][i][0], 20 * Math.log10(x / curves.length)]);
}
