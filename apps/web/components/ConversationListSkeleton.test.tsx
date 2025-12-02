import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ConversationListSkeleton } from './ConversationListSkeleton';

describe('ConversationListSkeleton', () => {
  it('should render default number of skeleton items', () => {
    const { container } = render(<ConversationListSkeleton />);
    const items = container.querySelectorAll('.px-4.py-3');

    expect(items.length).toBe(5);
  });

  it('should render custom number of skeleton items', () => {
    const { container } = render(<ConversationListSkeleton count={3} />);
    const items = container.querySelectorAll('.px-4.py-3');

    expect(items.length).toBe(3);
  });

  it('should render avatar skeletons', () => {
    const { container } = render(<ConversationListSkeleton count={1} />);
    const avatars = container.querySelectorAll('[style*="width: 48px"]');

    expect(avatars.length).toBeGreaterThan(0);
  });
});
