import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChatHeaderSkeleton } from './ChatHeaderSkeleton';

describe('ChatHeaderSkeleton', () => {
  it('should render header skeleton with correct structure', () => {
    const { container } = render(<ChatHeaderSkeleton />);
    const header = container.querySelector('.h-16.border-b');

    expect(header).toBeTruthy();
  });

  it('should render avatar skeleton', () => {
    const { container } = render(<ChatHeaderSkeleton />);
    const avatar = container.querySelector('[style*="width: 40px"]');

    expect(avatar).toBeTruthy();
  });

  it('should render user info skeletons', () => {
    const { container } = render(<ChatHeaderSkeleton />);
    const skeletons = container.querySelectorAll('.space-y-2 > div');

    // Should have name and status skeletons
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });

  it('should render action button skeletons', () => {
    const { container } = render(<ChatHeaderSkeleton />);
    const buttons = container.querySelectorAll('.space-x-2 > div');

    // Should have 3 action button skeletons
    expect(buttons.length).toBe(3);
  });
});
