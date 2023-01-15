export default function isMultichannel(phone, dualChannel) {
  if (phone.isTarget) return false;
  if (dualChannel) return true;

  return false;
}
