import { describe, it, expect } from 'vitest';
import {
  truncate,
  capitalize,
  toTitleCase,
  normalizeWhitespace,
  getInitials,
} from './stringUtils';

describe('stringUtils utilities', () => {
  describe('truncate', () => {
    it('should truncate strings longer than maxLength', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
      expect(truncate('This is a long string', 10)).toBe('This is a ...');
    });

    it('should not truncate strings shorter than or equal to maxLength', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('should return empty string for invalid inputs', () => {
      expect(truncate('', 5)).toBe('');
    });
  });

  describe('capitalize', () => {
    it('should capitalize the first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('Hello');
      expect(capitalize('hELLO')).toBe('Hello');
    });

    it('should handle single character strings', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('should return empty string for invalid inputs', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('toTitleCase', () => {
    it('should convert strings to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
      expect(toTitleCase('HELLO WORLD')).toBe('Hello World');
      expect(toTitleCase('hello WORLD')).toBe('Hello World');
    });

    it('should handle single word strings', () => {
      expect(toTitleCase('hello')).toBe('Hello');
    });

    it('should return empty string for invalid inputs', () => {
      expect(toTitleCase('')).toBe('');
    });
  });

  describe('normalizeWhitespace', () => {
    it('should remove extra whitespace', () => {
      expect(normalizeWhitespace('  hello   world  ')).toBe('hello world');
      expect(normalizeWhitespace('hello    world')).toBe('hello world');
      expect(normalizeWhitespace('  hello  ')).toBe('hello');
    });

    it('should handle strings with tabs and newlines', () => {
      expect(normalizeWhitespace('hello\t\tworld')).toBe('hello world');
      expect(normalizeWhitespace('hello\n\nworld')).toBe('hello world');
    });

    it('should return empty string for invalid inputs', () => {
      expect(normalizeWhitespace('')).toBe('');
      expect(normalizeWhitespace('   ')).toBe('');
    });
  });

  describe('getInitials', () => {
    it('should return initials for full names', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Alice Bob Charlie')).toBe('AC');
      expect(getInitials('Mary Jane Watson')).toBe('MW');
    });

    it('should return single initial for single word names', () => {
      expect(getInitials('John')).toBe('J');
      expect(getInitials('Alice')).toBe('A');
    });

    it('should handle names with extra whitespace', () => {
      expect(getInitials('  John   Doe  ')).toBe('JD');
    });

    it('should return empty string for invalid inputs', () => {
      expect(getInitials('')).toBe('');
      expect(getInitials('   ')).toBe('');
    });
  });
});
