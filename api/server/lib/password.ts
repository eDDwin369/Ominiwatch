/**
 * Password hashing.
 *
 * bcryptjs is the pure-JS build: this machine has no C++ toolchain, so the
 * native `bcrypt` package cannot compile here. The algorithm and cost factor
 * are identical, so swapping back to native `bcrypt` later is a one-line
 * change with no stored-hash migration.
 */
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, SALT_ROUNDS);

export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

/**
 * Burns roughly the same CPU as a real comparison when the user is absent.
 * Prevents user-enumeration via response timing on the login endpoint.
 */
export const fakeVerify = (): Promise<boolean> => bcrypt.compare('timing-attack-pad', hashForPadding());

/** A valid precomputed hash of a value nobody can submit. */
const PAD_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.7Y5cUxXn3UlxvB3Yp5NqT9t.6XhKzZ0Ku';
const hashForPadding = (): string => PAD_HASH;
