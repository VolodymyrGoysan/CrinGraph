import avgCurves from "helpers/avgCurves";

export default function getAverage({ avg, activeCurves, channels }) {
  // TODO: avg = isAverage (probably)
  if (avg) return activeCurves[0].l;

  let activeChannels = channels.filter(Boolean);
  
  return activeChannels.length === 1 ? activeChannels[0] : avgCurves(activeChannels);
}
