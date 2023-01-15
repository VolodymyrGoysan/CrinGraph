import { range, sum } from "d3";

// Graph smoothing
class Smoothener {
  constructor(props) {
    this.smoothLevel = props.smoothLevel || 5;
    this.smoothParams = props.smoothParams || {};
    this.smoothScale = props.smoothScale || 0.01;
    this.frequencyValues = props.frequencyValues || [20, 20000]
  }

  pair(arr, fn) {
    return arr.slice(1).map((v, i) => fn(v, arr[i]));
  }

  prepare(h, d) {
    const rh = h.map(d => 1 / d);

    const G = [
      rh.slice(0, rh.length - 1),
      this.pair(rh, (a, b) => -(a + b)),
      rh.slice(1),
    ];
    
    const dv = range(rh.length + 1).map(i => d(i));
    const dG = G.map((r, j) => r.map((e, i) => e * dv[i + j]));
    const d2 = dv.map(e => e * e);
    const h6 = h.map(d => d / 6);
    
    const M = [
      this.pair(h6, (a, b) => 2 * (a + b)),
      h6.slice(1, h6.length - 1),
      h6.slice(3).map(_ => 0),
    ];

    dG.forEach((_, k) =>
      dG.slice(k).forEach((g, i) =>
        dG[i].slice(k).forEach((a, j) => M[k][j] += a * g[j])
      )
    );

    // Diagonal LDL decomposition of M
    const md = [M[0][0]];
    const ml = M.slice(1).map(m => [m[0] / md]);
    
    range(1, M[0].length).forEach(j => {
      const n = ml.length;
      const p = md.slice(-n).reverse().map((d, i) => d * ml[i][j - 1 - i]);
      const a = M.map((m, k) => (
        m[j] - sum(p.slice(0, n - k), (a, i) => (
          a * ml[k + i][j - 1 - i]
        ))
      ));

      md.push(a[0]);
      ml.forEach((l, j) => l.push(a[j + 1] / a[0]));
    });

    return { G, md, ml, d2 };
  }

  evaluate(p, y) {
    let Gy = p.G[0].map(_ => 0);
    let n = Gy.length;
    
    p.G.forEach((r, j) => r.forEach((e, i) => Gy[i] += e * y[i + j]));
    
    // Forward substitution and multiply by p.md
    for (let i = 0; i < n; i++) {
      let yi = Gy[i];
    
      p.ml.forEach((m, k) => { let j = i + k + 1; if (j < n) Gy[j] -= m[i] * yi; });
      Gy[i] /= p.md[i];
    }
    
    // Back substitution
    for (let i = n; i--;) {
      let yi = Gy[i];
      p.ml.forEach((m, k) => { let j = i - k - 1; if (j >= 0) Gy[j] -= m[j] * yi; });
    }
    
    let u = y.slice();
    
    p.G.forEach((r, j) => r.forEach((e, i) => u[i + j] -= e * p.d2[i + j] * Gy[i]));
    
    return u;
  }

  prepareParams(frequencyValues) {
    let x = frequencyValues.map(f => Math.log(f));
    let h = this.pair(x, (a, b) => a - b);
    let s = this.smoothLevel * this.smoothScale;
    let d = i => s * Math.pow(1 / 80, Math.pow(i / x.length, 2));

    return this.prepare(h, d);
  }

  getParams(channelFV, channelFR) {
    if (channelFV.length !== this.frequencyValues.length) {
      return this.prepareParams(channelFR.map(d => d[0]));
    }

    this.smoothParams = this.smoothParams.G ? this.smoothParams : this.prepareParams(this.frequencyValues);
    
    return this.smoothParams;
  }

  smooth(channelFV, channelFR) {
    if (this.smoothLevel === 0) { return channelFV; }
    
    const params = this.getParams(channelFV, channelFR);

    return this.evaluate(params, channelFV);
  }
}

export default Smoothener;
