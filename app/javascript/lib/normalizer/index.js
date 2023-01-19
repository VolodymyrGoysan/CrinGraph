import { FREE_FIELD, ISO223_PARAMS } from "./constants";

// Normalization with target loudness
class Normalizer {
  constructor(props) {
    this.frequencyValues = props.frequencyValues;
    
    // Cached interpolated ISO parameters
    this.norm_par = [];
  }

  // Interpolate values for find_offset
  init_normalize(fv) {
    let par = [];
    // let par = {};
    let ff = [];
    let i = 0;
    
    // fixme
    par.free_field = ff;
    
    fv.forEach(function (f) {
      if (f >= ISO223_PARAMS.f[i]) { i++; }
      let i0 = Math.max(0, i - 1);
      let i1 = Math.min(i, ISO223_PARAMS.f.length - 1);
      let g;

      if (i0 === i1) {
        g = n => ISO223_PARAMS[n][i0];
      } else {
        let ll = [ISO223_PARAMS.f[i0], ISO223_PARAMS.f[i1], f].map(x => Math.log(x));
        let l = (ll[2] - ll[0]) / (ll[1] - ll[0]);
        
        g = n => { let v = ISO223_PARAMS[n]; return v[i0] + l * (v[i1] - v[i0]); };
      }
      
      let a = g("a_f");
      let m = a * (Math.log10(4) - 10 + g("L_U") / 10);
      let k = (0.005076 / Math.pow(10, m)) - Math.pow(10, a * g("T_f") / 10);
      let c = Math.pow(10, 9.4 + 4 * m) / fv.length;
      
      par.push({ a, k, c });
      
      const ffi = Math.floor(0.5 + 48 * Math.log2(f / 19.4806));
      const index = Math.max(0, Math.min(479, ffi));

      ff.push(FREE_FIELD[index]);
    });

    return par;
  }

  // Find the appropriate offset (in dB) for fr so that the total loudness
  // is equal to target (in phon)
  find_offset(frValues, target) {
    let par;
    
    if (frValues.length !== this.frequencyValues.length) {
      par = this.init_normalize(frValues.map(d => d[0]));
    } else {
      if (!this.norm_par.length) {
        this.norm_par = this.init_normalize(this.frequencyValues);
      }

      par = this.norm_par;
    }

    let fr = frValues.map(v => v[1]);
    let x = 0; // Initial offset
    function getStep(o) {
      const l10 = Math.log(10) / 10;
      let v = 0, d = 0;
      par.forEach(function (p, i) {
        let a = p.a, k = p.k, c = p.c, ds, v0, v1;
        v0 = Math.exp(l10 * (fr[i] + o - par.free_field[i]));
        ds = l10 * v0;
        v1 = k + Math.pow(v0, a);
        ds *= a * Math.pow(v0, a - 1);
        v += c * Math.pow(v1, 4);
        ds *= c * 4 * Math.pow(v1, 3);
        d += ds;
      });
      // value: Math.log(v)/l10
      // deriv: d / (l10*v)
      return (Math.log(v) - target * l10) * (v / d);
    }
    let dx;
    do {
      dx = getStep(x);
      x -= dx;
    } while (Math.abs(dx) > 0.01);
    return x;
  }
}

export default Normalizer;
