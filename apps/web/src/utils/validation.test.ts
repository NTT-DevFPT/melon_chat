import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPassword, isValidUsername } from './validation';

describe('validation utilities', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
    });

    it('should return false for empty or non-string inputs', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('   ')).toBe(false);
    });

    it('should handle emails with whitespace', () => {
      expect(isValidEmail('  test@example.com  ')).toBe(true);
    });
  });

  describe('isValidPassword', () => {
    it('should return true for valid passwords', () => {
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('Test1234')).toBe(true);
      expect(isValidPassword('MyP@ssw0rd')).toBe(true);
    });

    it('should return false for passwords without letters', () => {
      expect(isValidPassword('12345678')).toBe(false);
    });

    it('should return false for passwords without numbers', () => {
      expect(isValidPassword('password')).toBe(false);
    });

    it('should return false for passwords shorter than 8 characters', () => {
      expect(isValidPassword('Pass1')).toBe(false);
      expect(isValidPassword('Test12')).toBe(false);
    });

    it('should return false for empty or non-string inputs', () => {
      expect(isValidPassword('')).toBe(false);
    });
  });

  describe('isValidUsername', () => {
    it('should return true for valid usernames', () => {
      expect(isValidUsername('user123')).toBe(true);
      expect(isValidUsername('john_doe')).toBe(true);
      expect(isValidUsername('Alice')).toBe(true);
    });

    it('should return false for usernames starting with numbers', () => {
      expect(isValidUsername('123user')).toBe(false);
    });

    it('should return false for usernames with special characters', () => {
      expect(isValidUsername('user@name')).toBe(false);
      expect(isValidUsername('user-name')).toBe(false);
      expect(isValidUsername('user.name')).toBe(false);
    });

    it('should return false for usernames shorter than 3 characters', () => {
      expect(isValidUsername('ab')).toBe(false);
      expect(isValidUsername('a1')).toBe(false);
    });

    it('should return false for usernames longer than 20 characters', () => {
      expect(isValidUsername('a'.repeat(21))).toBe(false);
    });

    it('should return false for empty or non-string inputs', () => {
      expect(isValidUsername('')).toBe(false);
    });
  });
});
