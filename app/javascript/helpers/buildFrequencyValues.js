// Standard frequencies, all phone need to interpolate to this
export default function buildFrequencyValues() {
  let frequencies = [20];
  let step = Math.pow(2, 1 / 48); // 1/48 octave

  while (frequencies[frequencies.length - 1] < 20000) {
    frequencies.push(frequencies[frequencies.length - 1] * step)
  }
  
  return frequencies;
}
