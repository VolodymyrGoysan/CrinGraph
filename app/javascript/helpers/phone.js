export function phoneOffset({ offset, norm }) {
  return offset + norm;
}

export function phoneFullName({ dispBrand, dispName }) {
  return `${dispBrand} ${dispName}`;
}

export function channelName(phone, number) {
  return `${phoneFullName(phone)} (${number})`;
}
