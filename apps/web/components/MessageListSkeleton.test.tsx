import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MessageListSkeleton } from './MessageListSkeleton';

describe('MessageListSkeleton', () => {
  it('should render default number of skeleton messages', () => {
    const { container } = render(<MessageListSkeleton />);
    const messages = container.querySelectorAll('.space-y-4 > div');

    expect(messages.length).toBe(8);
  });

  it('should render custom number of skeleton messages', () => {
    const { container } = render(<MessageListSkeleton count={5} />);
    const messages = container.querySelectorAll('.space-y-4 > div');

    expect(messages.length).toBe(5);
  });

  it('should alternate between left and right aligned messages', () => {
    const { container } = render(<MessageListSkeleton count={4} />);
    const messages = container.querySelectorAll('.space-y-4 > div');

    // Check that some messages are left-aligned and some are right-aligned
    const leftAligned = Array.from(messages).filter((msg) =>
      msg.className.includes('justify-start')
    );
    const rightAligned = Array.from(messages).filter((msg) =>
      msg.className.includes('justify-end')
    );

    expect(leftAligned.length).toBeGreaterThan(0);
    expect(rightAligned.length).toBeGreaterThan(0);
  });
});
