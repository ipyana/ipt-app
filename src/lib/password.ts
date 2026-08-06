const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SPECIAL = "!@#$%&*";

export function generateTemporaryPassword(length = 12): string {
  const all = UPPER + LOWER + DIGITS + SPECIAL;
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  const chars: string[] = [];
  for (let i = 0; i < length; i++) {
    chars.push(all[arr[i] % all.length]);
  }
  // Guarantee at least one of each required class for strongPasswordSchema.
  chars[0] = UPPER[arr[0] % UPPER.length];
  chars[1] = DIGITS[arr[1] % DIGITS.length];
  chars[2] = SPECIAL[arr[2] % SPECIAL.length];
  chars[3] = LOWER[arr[3] % LOWER.length];
  return chars.join("");
}
