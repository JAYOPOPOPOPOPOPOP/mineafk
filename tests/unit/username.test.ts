/**
 * Example unit test - run with: npx vitest
 * Username validation for offline Minecraft accounts
 */
import { describe, it, expect } from 'vitest';
import { USERNAME_REGEX } from '../../packages/shared/src/constants';

describe('Minecraft username', () => {
  it('accepts valid names', () => {
    expect(USERNAME_REGEX.test('Steve')).toBe(true);
    expect(USERNAME_REGEX.test('Player_123')).toBe(true);
  });

  it('rejects invalid names', () => {
    expect(USERNAME_REGEX.test('ab')).toBe(false);
    expect(USERNAME_REGEX.test('this_name_is_way_too_long')).toBe(false);
    expect(USERNAME_REGEX.test('bad-name!')).toBe(false);
  });
});
