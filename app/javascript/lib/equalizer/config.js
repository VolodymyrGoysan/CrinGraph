// Change sample rate will affect the curve of filters close to nyquist frequency
// Here I choosed a common used value, but not all DSP software use this sample rate for EQ
export const DEFAULT_SAMPLE_RATE = 48000;

// AutoEQ will avoid filters above this frequency at first batch
export const TREBLE_START_FROM = 7000;

// Avoid filters close to nyquist frequency by default, because the behavior is implementation dependent
// https://github.com/jaakkopasanen/AutoEq/issues/240
// https://github.com/jaakkopasanen/AutoEq/issues/411

export const DEFAULT_AUTO_EQ_RANGE = [20, 15000];

// Minimum and maximum Q for AutoEQ feature
export const DEFAULT_Q_RANGE = [0.5, 2];

// Minimum and maximum Gain for AutoEQ feature
export const DEFAULT_GAIN_RANGE = [-12, 12];
 
// Delta and step of Freq, Q and Gain used for AutoEQ optimizing
export const DELTA_MATRIX = [
  [10, 10, 10, 5, 0.1, 0.5],
  [10, 10, 10, 2, 0.1, 0.2],
  [10, 10, 10, 1, 0.1, 0.1],
];
