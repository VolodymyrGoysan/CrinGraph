/*
  Biquad algorithms are taken from:
  https://github.com/jaakkopasanen/AutoEq/blob/master/biquad.py
  https://github.com/mohayonao/biquad-coeffs/tree/master/packages/biquad-coeffs-cookbook
*/

import {
  DEFAULT_SAMPLE_RATE,
  DEFAULT_AUTO_EQ_RANGE,
  DEFAULT_Q_RANGE,
  DEFAULT_GAIN_RANGE,
  TREBLE_START_FROM,
  DELTA_MATRIX
} from "./config";

// Smoothed 127 bands frequencies for graphic eq (wavelet)
const buildGraphicEQFequences = (min = 20, max = 20000) => {
  const slice = Math.log(max / min) / Math.log(1.0563);
  const bandsCount = Math.ceil(slice);
  const frequenciesArray = new Array(bandsCount).fill(null).map((_, i) => Math.floor(20 * Math.pow(1.0563, i)));

  return [...new Set(frequenciesArray)].sort((a, b) => a - b);
};

// Use to get response diff by EQ before smoothing
// ~= 1/96 octave
const buildGraphicEQRawFrequences = () => {
  const slice = Math.log(20000 / 20) / Math.log(1.0072);
  const bandsCount = Math.ceil(slice);

  return new Array(bandsCount).fill(null).map((_, i) => 20 * Math.pow(1.0072, i))
};

class Equalizer {
  constructor(props = {}) {
    this.sampleRate = props.sampleRate || DEFAULT_SAMPLE_RATE;
    this.autoEQRange = props.autoEQRange || DEFAULT_AUTO_EQ_RANGE;
    this.qRange = props.qRange || DEFAULT_Q_RANGE;
    this.gainRange = props.gainRange || DEFAULT_GAIN_RANGE;
    this.trebleStartFrom = props.trebleStartFrom || TREBLE_START_FROM;
    this.deltaMatrix = props.deltaMatrix || DELTA_MATRIX;
  }

  interp(fv, fr) {
    let i = 0;
    return fv.map(f => {
      for (; i < fr.length - 1; ++i) {
        let [f0, v0] = fr[i];
        let [f1, v1] = fr[i + 1];
        if (i == 0 && f < f0) {
          return [f, v0];
        } else if (f >= f0 && f < f1) {
          let v = v0 + (v1 - v0) * (f - f0) / (f1 - f0);
          return [f, v];
        }
      }
      return [f, fr[fr.length - 1][1]];
    });
  }

  lowshelf(freq, q, gain, sampleRate) {
    freq = freq / (sampleRate || DEFAULT_SAMPLE_RATE);
    freq = Math.max(1e-6, Math.min(freq, 1));
    q = Math.max(1e-4, Math.min(q, 1000));
    gain = Math.max(-40, Math.min(gain, 40));

    let w0 = 2 * Math.PI * freq;
    let sin = Math.sin(w0);
    let cos = Math.cos(w0);
    let a = Math.pow(10, (gain / 40));
    let alpha = sin / (2 * q);
    let alphamod = (2 * Math.sqrt(a) * alpha) || 0;

    let a0 = ((a + 1) + (a - 1) * cos + alphamod);
    let a1 = -2 * ((a - 1) + (a + 1) * cos);
    let a2 = ((a + 1) + (a - 1) * cos - alphamod);
    let b0 = a * ((a + 1) - (a - 1) * cos + alphamod);
    let b1 = 2 * a * ((a - 1) - (a + 1) * cos);
    let b2 = a * ((a + 1) - (a - 1) * cos - alphamod);

    return [1.0, a1 / a0, a2 / a0, b0 / a0, b1 / a0, b2 / a0];
  }

  highshelf(freq, q, gain, sampleRate) {
    freq = freq / (sampleRate || DEFAULT_SAMPLE_RATE);
    freq = Math.max(1e-6, Math.min(freq, 1));
    q = Math.max(1e-4, Math.min(q, 1000));
    gain = Math.max(-40, Math.min(gain, 40));

    let w0 = 2 * Math.PI * freq;
    let sin = Math.sin(w0);
    let cos = Math.cos(w0);
    let a = Math.pow(10, (gain / 40));
    let alpha = sin / (2 * q);
    let alphamod = (2 * Math.sqrt(a) * alpha) || 0;

    let a0 = ((a + 1) - (a - 1) * cos + alphamod);
    let a1 = 2 * ((a - 1) - (a + 1) * cos);
    let a2 = ((a + 1) - (a - 1) * cos - alphamod);
    let b0 = a * ((a + 1) + (a - 1) * cos + alphamod);
    let b1 = -2 * a * ((a - 1) + (a + 1) * cos);
    let b2 = a * ((a + 1) + (a - 1) * cos - alphamod);

    return [1.0, a1 / a0, a2 / a0, b0 / a0, b1 / a0, b2 / a0];
  }

  peaking(freq, q, gain, sampleRate) {
    freq = freq / (sampleRate || DEFAULT_SAMPLE_RATE);
    freq = Math.max(1e-6, Math.min(freq, 1));
    q = Math.max(1e-4, Math.min(q, 1000));
    gain = Math.max(-40, Math.min(gain, 40));

    let w0 = 2 * Math.PI * freq;
    let sin = Math.sin(w0);
    let cos = Math.cos(w0);
    let a = Math.pow(10, (gain / 40));
    let alpha = sin / (2 * q);

    let a0 = 1 + alpha / a;
    let a1 = -2 * cos;
    let a2 = 1 - alpha / a;
    let b0 = 1 + alpha * a;
    let b1 = -2 * cos;
    let b2 = 1 - alpha * a;

    return [1.0, a1 / a0, a2 / a0, b0 / a0, b1 / a0, b2 / a0];
  }

  calc_gains(freqs, coeffs, sampleRate) {
    sampleRate = sampleRate || DEFAULT_SAMPLE_RATE;
    let gains = new Array(freqs.length).fill(0);

    for (let i = 0; i < coeffs.length; ++i) {
      let [a0, a1, a2, b0, b1, b2] = coeffs[i];
      for (let j = 0; j < freqs.length; ++j) {
        let w = 2 * Math.PI * freqs[j] / sampleRate;
        let phi = 4 * Math.pow(Math.sin(w / 2), 2);
        let c = (
          10 * Math.log10(Math.pow(b0 + b1 + b2, 2) +
            (b0 * b2 * phi - (b1 * (b0 + b2) + 4 * b0 * b2)) * phi) -
          10 * Math.log10(Math.pow(a0 + a1 + a2, 2) +
            (a0 * a2 * phi - (a1 * (a0 + a2) + 4 * a0 * a2)) * phi));
        gains[j] += c;
      }
    }
    return gains;
  }

  calc_preamp(fr1, fr2) {
    let maxGain = -Infinity;
    for (let i = 0; i < fr1.length; ++i) {
      maxGain = Math.max(maxGain, fr2[i][1] - fr1[i][1]);
    }
    return -maxGain;
  }

  calc_distance(fr1, fr2) {
    let distance = 0;
    for (let i = 0; i < fr1.length; ++i) {
      let d = Math.abs(fr1[i][1] - fr2[i][1]);
      distance += (d >= 0.1 ? d : 0);
    }
    return distance / fr1.length;
  }

  filters_to_coeffs(filters, sampleRate) {
    return filters.map(f => {
      if (!f.freq || !f.gain || !f.q) {
        return null;
      } else if (f.type === "LSQ") {
        return lowshelf(f.freq, f.q, f.gain, sampleRate);
      } else if (f.type === "HSQ") {
        return highshelf(f.freq, f.q, f.gain, sampleRate);
      } else if (f.type === "PK") {
        return peaking(f.freq, f.q, f.gain, sampleRate);
      }
      return null;
    }).filter(f => f);
  }

  apply(fr, filters, sampleRate) {
    let freqs = new Array(fr.length).fill(null);
    for (let i = 0; i < fr.length; ++i) {
      freqs[i] = fr[i][0];
    }
    let coeffs = filters_to_coeffs(filters, sampleRate);
    let gains = calc_gains(freqs, coeffs, sampleRate);
    let fr_eq = new Array(fr.length).fill(null);
    for (let i = 0; i < fr.length; ++i) {
      fr_eq[i] = [fr[i][0], fr[i][1] + gains[i]];
    }
    return fr_eq;
  }

  as_graphic_eq(filters, sampleRate) {
    let rawFS = buildGraphicEQRawFrequences();
    const fs = buildGraphicEQFequences();
    let coeffs = filters_to_coeffs(filters, sampleRate);
    let gains = calc_gains(rawFS, coeffs, sampleRate);
    let rawFR = rawFS.map((f, i) => [f, gains[i]]);
    // Interpolate and smoothing with moving average
    let i = 0;
    let resultFR = fs.map((f, j) => {
      let freqTo = (j < fs.length - 1) ? Math.sqrt(f * fs[j + 1]) : 20000;
      let points = [];
      for (; i < rawFS.length; ++i) {
        if (rawFS[i] < freqTo) {
          points.push(rawFR[i][1]);
        } else {
          break
        }
      }
      let avg = points.reduce((a, b) => a + b, 0) / points.length;
      return [f, avg];
    });
    // Normalize (apply preamp)
    let maxGain = resultFR.reduce((a, b) => a > b[1] ? a : b[1], -Infinity);
    resultFR = resultFR.map(([f, v]) => [f, v - maxGain]);
    return resultFR;
  }

  search_candidates(fr, frTarget, threshold) {
    let state = 0; // 1: peak, 0: matched, -1: dip
    let startIndex = -1;
    let candidates = [];
    let [minFreq, maxFreq] = DEFAULT_AUTO_EQ_RANGE;
    for (let i = 0; i < fr.length; ++i) {
      let [f, v0] = fr[i];
      let v1 = frTarget[i][1];
      let delta = v0 - v1;
      let deltaAbs = Math.abs(delta);
      let nextState = (deltaAbs < threshold) ? 0 : (delta / deltaAbs);
      if (nextState === state) {
        continue;
      }
      if (startIndex >= 0) {
        if (state != 0) {
          let start = fr[startIndex][0];
          let end = f;
          let center = Math.sqrt(start * end);
          let gain = (
            interp([center], frTarget.slice(startIndex, i))[0][1] -
            interp([center], fr.slice(startIndex, i))[0][1]);
          let q = center / (end - start);
          if (center >= minFreq && center <= maxFreq) {
            candidates.push({ type: "PK", freq: center, q, gain });
          }
        }
        startIndex = -1;
      } else {
        startIndex = i;
      }
      state = nextState;
    }
    return candidates;
  }

  freq_unit(freq) {
    if (freq < 100) {
      return 1;
    } else if (freq < 1000) {
      return 10;
    } else if (freq < 10000) {
      return 100;
    }
    return 1000;
  }

  strip(filters) {
    // Make freq, q and gain look better and more compatible to some DSP device
    let [minQ, maxQ] = DEFAULT_Q_RANGE;
    let [minGain, maxGain] = DEFAULT_GAIN_RANGE;

    return filters.map(f => ({
      type: f.type,
      freq: Math.floor(f.freq - f.freq % freq_unit(f.freq)),
      q: Math.min(Math.max(Math.floor(f.q * 10) / 10, minQ), maxQ),
      gain: Math.min(Math.max(Math.floor(f.gain * 10) / 10, minGain), maxGain)
    }));
  }

  optimize(fr, frTarget, filters, iteration, dir) {
    filters = strip(filters);
    let combinations = [];
    let [minFreq, maxFreq] = DEFAULT_AUTO_EQ_RANGE;
    let [minQ, maxQ] = DEFAULT_Q_RANGE;
    let [minGain, maxGain] = DEFAULT_GAIN_RANGE;
    let [maxDF, maxDQ, maxDG, stepDF, stepDQ, stepDG] = (
      DELTA_MATRIX[iteration]);
    let [begin, end, step] = (dir ?
      [filters.length - 1, -1, -1] : [0, filters.length, 1]);
    // Optimize freq, q, gain
    for (let i = begin; i != end; i += step) {
      let f = filters[i];
      let fr1 = apply(fr, filters.filter((f, fi) => fi !== i));
      let fr2 = apply(fr1, [f]);
      let fr3 = apply(fr, filters);
      let bestFilter = f;
      let bestDistance = calc_distance(fr2, frTarget);
      let testNewFilter = (df, dq, dg) => {
        let freq = f.freq + df * freq_unit(f.freq) * stepDF;
        let q = f.q + dq * stepDQ;
        let gain = f.gain + dg * stepDG;
        if (freq < minFreq || freq > maxFreq || q < minQ ||
          q > maxQ || gain < minGain || gain > maxGain) {
          return false;
        }
        let newFilter = { type: f.type, freq, q, gain };
        let newFR = apply(fr1, [newFilter]);
        let newDistance = calc_distance(newFR, frTarget);
        if (newDistance < bestDistance) {
          bestFilter = newFilter;
          bestDistance = newDistance;
          return true;
        }
        return false;
      }
      for (let df = -maxDF; df < maxDF; ++df) {
        // Use smaller Q as possible
        for (let dq = maxDQ - 1; dq >= -maxDQ; --dq) {
          for (let dg = 1; dg < maxDG; ++dg) {
            if (!testNewFilter(df, dq, dg)) {
              break;
            }
          }
          for (let dg = -1; dg >= -maxDG; --dg) {
            if (!testNewFilter(df, dq, dg)) {
              break;
            }
          }
        }
      }
      filters[i] = bestFilter;
    }
    if (!dir) {
      return optimize(fr, frTarget, filters, iteration, 1);
    } else {
      filters = filters.sort((a, b) => a.freq - b.freq);
      // Merge closed filters
      for (let i = 0; i < filters.length - 1;) {
        let f1 = filters[i];
        let f2 = filters[i + 1];
        if (Math.abs(f1.freq - f2.freq) <= freq_unit(f1.freq) &&
          Math.abs(f1.q - f2.q) <= 0.1) {
          f1.gain += f2.gain;
          filters.splice(i + 1, 1);
        } else {
          ++i;
        }
      }
      // Remove unnecessary filters
      let bestDistance = calc_distance(apply(fr, filters), frTarget);
      for (let i = 0; i < filters.length;) {
        if (Math.abs(filters[i].gain) <= 0.1) {
          filters.splice(i, 1);
          continue;
        }
        let newDistance = calc_distance(apply(fr,
          filters.filter((f, fi) => fi !== i)), frTarget);
        if (newDistance < bestDistance) {
          filters.splice(i, 1);
          bestDistance = newDistance;
        } else {
          ++i;
        }
      }
      return filters;
    }
  }

  autoeq(fr, frTarget, maxFilters) {
    // 2 steps manual optimized algorithm
    // fr, frTarget should has same resolution and normalized
    let firstBatchSize = Math.max(Math.floor(maxFilters / 2) - 1, 1);
    let firstCandidates = search_candidates(fr, frTarget, 1);
    let firstFilters = (firstCandidates
      // Dont adjust treble in the first batch
      .filter(c => c.freq <= TREBLE_START_FROM)
      // Wider bandwidth (smaller Q) come first
      .sort((a, b) => a.q - b.q)
      .slice(0, firstBatchSize)
      .sort((a, b) => a.freq - b.freq));
    for (let i = 0; i < DELTA_MATRIX.length; ++i) {
      firstFilters = optimize(fr, frTarget, firstFilters, i);
    }
    let secondFR = apply(fr, firstFilters);
    let secondBatchSize = maxFilters - firstFilters.length;
    let secondCandidates = search_candidates(secondFR, frTarget, 0.5);
    let secondFilters = (secondCandidates
      .sort((a, b) => a.q - b.q)
      .slice(0, secondBatchSize)
      .sort((a, b) => a.freq - b.freq));
    for (let i = 0; i < DELTA_MATRIX.length; ++i) {
      secondFilters = optimize(secondFR, frTarget, secondFilters, i);
    }
    let allFilters = firstFilters.concat(secondFilters);
    for (let i = 0; i < DELTA_MATRIX.length; ++i) {
      allFilters = optimize(fr, frTarget, allFilters, i);
    }
    return strip(allFilters);
  }
};

export default Equalizer;
