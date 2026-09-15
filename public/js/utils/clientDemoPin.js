export function parseClientDemoPin(value) {
  const pin = String(value ?? "").trim();
  if (!pin) return { valid: true, pin: null };
  if (!/^\d{4,6}$/.test(pin)) {
    return { valid: false, pin: null };
  }
  return { valid: true, pin };
}

export function verifyClientDemoPin(enteredPin, requiredPin) {
  const expected = parseClientDemoPin(requiredPin);
  const entered = parseClientDemoPin(enteredPin);
  return Boolean(expected.valid && expected.pin && entered.valid && entered.pin === expected.pin);
}
