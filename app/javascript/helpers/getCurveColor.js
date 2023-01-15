import { hcl } from "d3";
import { LD_P1 } from "../components/GraphTool/constants";

export default function getCurveColor(id, o) {
  let p1 = LD_P1;
  let p2 = p1 * p1;
  let p3 = p2 * p1;
  let t = o / 32;
  let i = id / p3 + 0.76, j = id / p2 + 0.79, k = id / p1 + 0.32;

  if (id < 0) {
    return hcl(360 * (1 - (-i) % 1), 5, 66);
  } // Target
  
  let th = 2 * Math.PI * i;
  
  i += Math.cos(th - 0.3) / 24 + Math.cos(6 * th) / 32;
  
  const s = Math.sin(2 * Math.PI * i);
  
  return hcl(
    360 * ((i + t / p2) % 1),
    88 + 30 * (j % 1 + 1.3 * s - t / p3),
    36 + 22 * (k % 1 + 1.1 * s + 6 * t * (1 - s)),
  );
}
