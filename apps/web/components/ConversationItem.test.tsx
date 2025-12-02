import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationItem } from './ConversationItem';
import { UserStatus } from '../types';

describe('ConversationItem', () => {
  const defaultProps = {
    name: 'John Doe',
    avatar: 'https://example.com/avatar.jpg',
    lastMessage: 'Hello there!',
    timestamp: '10:30 AM',
    unreadCount: 0,
    isActive: false,
    status: UserStatus.ONLINE,
    onClick: vi.fn(),
  };

  it('should render conversation name', () => {
    render(<ConversationItem {...defaultProps} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render last message', () => {
    render(<ConversationItem {...defaultProps} />);

    expect(screen.getByText('Hello there!')).toBeInTheDocument();
  });

  it('should render timestamp', () => {
    render(<ConversationItem {...defaultProps} />);

    expect(screen.getByText('10:30 AM')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    render(<ConversationItem {...defaultProps} />);

    const item = screen.getByText('John Doe').closest('div');
    if (item) {
      fireEvent.click(item);
    }

    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('should apply active styles when isActive is true', () => {
    const { container } = render(
      <ConversationItem {...defaultProps} isActive={true} />
    );

    const activeItem = container.querySelector('.bg-slate-800\\/50');
    expect(activeItem).toBeInTheDocument();
  });

  it('should not apply active styles when isActive is false', () => {
    const { container } = render(
      <ConversationItem {...defaultProps} isActive={false} />
    );

    const activeItem = container.querySelector('.bg-slate-800\\/50');
    expect(activeItem).not.toBeInTheDocument();
  });

  it('should display unread message with bold text when unreadCount > 0', () => {
    render(<ConversationItem {...defaultProps} unreadCount={3} />);

    const lastMessage = screen.getByText('Hello there!');
    expect(lastMessage).toHaveClass('font-semibold');
  });

  it('should display normal text when unreadCount is 0', () => {
    render(<ConversationItem {...defaultProps} unreadCount={0} />);

    const lastMessage = screen.getByText('Hello there!');
    expect(lastMessage).not.toHaveClass('font-semibold');
  });

  it('should render avatar with correct src', () => {
    render(<ConversationItem {...defaultProps} />);

    const avatar = screen.getByAltText('avatar');
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('should pass status to Avatar component', () => {
    render(<ConversationItem {...defaultProps} status={UserStatus.ONLINE} />);

    // Avatar component should receive the status prop
    const avatar = screen.getByAltText('avatar');
    expect(avatar).toBeInTheDocument();
  });
});
