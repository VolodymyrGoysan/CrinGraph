import { bisect } from "d3";

function frToIndex(fr, f_values) {
  return bisect(f_values, fr, 0, f_values.length - 1);
}

export default frToIndex;
