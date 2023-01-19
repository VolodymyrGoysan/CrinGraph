export const PADDING = {
  left: 15,
  right: 15,
  top: 10,
  bottom: 36
};

export const OUTER_WIDTH = 800;
export const OUTER_HEIGHT = 360;
export const INNER_WIDTH = OUTER_WIDTH - PADDING.left - PADDING.right;
export const INNER_HEIGHT = OUTER_HEIGHT - PADDING.top - PADDING.bottom;
export const Y_EXTREMUMS = [29.5, 85]; // Decibels (limits, range)
export const Y_BOUNDS = [PADDING.top + INNER_HEIGHT, PADDING.top + 10];
export const X_EXTREMUMS = [20, 20000];
export const X_BOUNDS = [PADDING.left, PADDING.left + INNER_WIDTH];

export const X_VALUES = [2, 3, 4, 5, 6, 8, 10, 15];
export const FADE_WINTH = 7;
export const FADE_INTERIOR_WIDTH = 30; // Width at an interior edge

export const ZOOM_RANGES = [
  [20, 400],
  [100, 4000],
  [1000, 20000],
  X_EXTREMUMS,
];

export const ZOOM_EDGE_WIDTHS = [
  [FADE_WINTH, FADE_INTERIOR_WIDTH],
  [FADE_INTERIOR_WIDTH, FADE_INTERIOR_WIDTH],
  [FADE_INTERIOR_WIDTH, FADE_WINTH],
  [FADE_WINTH, FADE_WINTH],
];
