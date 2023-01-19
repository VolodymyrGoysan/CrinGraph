export function phoneOffset({ offset, norm }) {
  return offset + norm;
}

export function phoneFullName({ dispBrand, dispName }) {
  return `${dispBrand} ${dispName}`;
}

export function channelName(phone, number) {
  return `${phoneFullName(phone)} (${number})`;
}

export function isMultichannel(phone, dualChannel) {
  if (phone.isTarget) return false;
  if (dualChannel) return true;

  return false;
}

export function numChannels({ channels }) {
  return channels.filter(Boolean).length;
}

export function hasChannelSel(p) {
  return isMultichannel(p) && numChannels(p) > 1;
}

export function hasImbalance(p) {
  if (!hasChannelSel(p)) return false;
  let as = p.channels[0], bs = p.channels[1];
  let s0 = 0, s1 = 0;
  return as.some((a, i) => {
    let d = a[1] - bs[i][1];
    d *= 1 / (50 * Math.sqrt(1 + Math.pow(a[0] / 1e4, 6)));
    s0 = Math.max(s0 + d, 0);
    s1 = Math.max(s1 - d, 0);
    return Math.max(s0, s1) > this.config.maxChannelImbalance;
  });
}
