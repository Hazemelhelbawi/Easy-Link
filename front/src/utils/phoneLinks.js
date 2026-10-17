export function digitsOnly(mobile) {
  return String(mobile ?? '').replace(/\D/g, '');
}

export function telHref(mobile) {
  const d = digitsOnly(mobile);
  if (!d) return null;
  const normalized = d.startsWith('966') ? d : d.startsWith('0') ? `966${d.slice(1)}` : `966${d}`;
  return `tel:+${normalized}`;
}

export function whatsAppHref(mobile) {
  const d = digitsOnly(mobile);
  if (!d) return null;
  const normalized = d.startsWith('966') ? d : d.startsWith('0') ? `966${d.slice(1)}` : `966${d}`;
  return `https://wa.me/${normalized}`;
}
