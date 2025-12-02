import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatHeader } from './ChatHeader';
import { ConversationType } from '../types';

describe('ChatHeader', () => {
  const defaultProps = {
    title: 'Test User',
    subtitle: 'Online',
    avatar: 'https://example.com/avatar.jpg',
    conversationType: ConversationType.DIRECT,
    onPhoneCall: vi.fn(),
    onVideoCall: vi.fn(),
    onToggleInfo: vi.fn(),
    isInfoOpen: false,
  };

  it('should render title and subtitle', () => {
    render(<ChatHeader {...defaultProps} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should render avatar image', () => {
    render(<ChatHeader {...defaultProps} />);

    const avatar = screen.getByAltText('Test User');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('should show online indicator for direct conversations', () => {
    const { container } = render(<ChatHeader {...defaultProps} />);

    const onlineIndicator = container.querySelector('.bg-green-500');
    expect(onlineIndicator).toBeInTheDocument();
  });

  it('should not show online indicator for group conversations', () => {
    const { container } = render(
      <ChatHeader {...defaultProps} conversationType={ConversationType.GROUP} />
    );

    const onlineIndicator = container.querySelector('.bg-green-500');
    expect(onlineIndicator).not.toBeInTheDocument();
  });

  it('should call onPhoneCall when phone button is clicked', () => {
    render(<ChatHeader {...defaultProps} />);

    const phoneButton = screen.getByTitle('Phone Call');
    fireEvent.click(phoneButton);

    expect(defaultProps.onPhoneCall).toHaveBeenCalledTimes(1);
  });

  it('should call onVideoCall when video button is clicked', () => {
    render(<ChatHeader {...defaultProps} />);

    const videoButton = screen.getByTitle('Video Call');
    fireEvent.click(videoButton);

    expect(defaultProps.onVideoCall).toHaveBeenCalledTimes(1);
  });

  it('should call onToggleInfo when more button is clicked', () => {
    render(<ChatHeader {...defaultProps} />);

    const moreButton = screen.getByTitle('Show Info');
    fireEvent.click(moreButton);

    expect(defaultProps.onToggleInfo).toHaveBeenCalledTimes(1);
  });

  it('should show correct title when info is open', () => {
    render(<ChatHeader {...defaultProps} isInfoOpen={true} />);

    expect(screen.getByTitle('Hide Info')).toBeInTheDocument();
  });
});
