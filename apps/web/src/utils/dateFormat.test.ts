import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatDate, formatTime, formatDateTime } from './dateFormat';

describe('dateFormat utilities', () => {
  beforeEach(() => {
    // Mock the current date to ensure consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  describe('formatDate', () => {
    it('should return "Just now" for very recent dates', () => {
      const now = new Date('2024-01-15T12:00:00Z').toISOString();
      expect(formatDate(now)).toBe('Just now');
    });

    it('should return minutes ago for dates within the last hour', () => {
      const fiveMinutesAgo = new Date('2024-01-15T11:55:00Z').toISOString();
      expect(formatDate(fiveMinutesAgo)).toBe('5 minutes ago');

      const oneMinuteAgo = new Date('2024-01-15T11:59:00Z').toISOString();
      expect(formatDate(oneMinuteAgo)).toBe('1 minute ago');
    });

    it('should return hours ago for dates within the last 24 hours', () => {
      const twoHoursAgo = new Date('2024-01-15T10:00:00Z').toISOString();
      expect(formatDate(twoHoursAgo)).toBe('2 hours ago');

      const oneHourAgo = new Date('2024-01-15T11:00:00Z').toISOString();
      expect(formatDate(oneHourAgo)).toBe('1 hour ago');
    });

    it('should return days ago for dates within the last week', () => {
      const twoDaysAgo = new Date('2024-01-13T12:00:00Z').toISOString();
      expect(formatDate(twoDaysAgo)).toBe('2 days ago');

      const oneDayAgo = new Date('2024-01-14T12:00:00Z').toISOString();
      expect(formatDate(oneDayAgo)).toBe('1 day ago');
    });

    it('should return formatted date for dates older than a week', () => {
      const oldDate = new Date('2023-12-01T12:00:00Z').toISOString();
      const result = formatDate(oldDate);
      expect(result).toContain('Dec');
      expect(result).toContain('2023');
    });

    it('should return "Invalid date" for invalid date strings', () => {
      expect(formatDate('invalid')).toBe('Invalid date');
      expect(formatDate('')).toBe('Invalid date');
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2024-01-15T14:30:00Z').toISOString();
      const result = formatTime(date);
      // Result will vary based on timezone, so just check it contains expected parts
      expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
    });

    it('should return "Invalid time" for invalid date strings', () => {
      expect(formatTime('invalid')).toBe('Invalid time');
      expect(formatTime('')).toBe('Invalid time');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const date = new Date('2024-01-15T14:30:00Z').toISOString();
      const result = formatDateTime(date);
      expect(result).toContain('Jan');
      expect(result).toContain('2024');
      expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
    });

    it('should return "Invalid date" for invalid date strings', () => {
      expect(formatDateTime('invalid')).toBe('Invalid date');
      expect(formatDateTime('')).toBe('Invalid date');
    });
  });
});
