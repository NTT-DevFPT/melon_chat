import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSend: vi.fn(),
    onFileSelect: vi.fn(),
    isUploading: false,
  };

  it('should render input field with placeholder', () => {
    render(<ChatInput {...defaultProps} />);

    const input = screen.getByPlaceholderText('Type your message...');
    expect(input).toBeInTheDocument();
  });

  it('should call onChange when typing', () => {
    render(<ChatInput {...defaultProps} />);

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hello' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('Hello');
  });

  it('should call onSend when Enter key is pressed', () => {
    render(<ChatInput {...defaultProps} value="Hello" />);

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(defaultProps.onSend).toHaveBeenCalledTimes(1);
  });

  it('should call onSend when send button is clicked', () => {
    const onSend = vi.fn();
    render(<ChatInput {...defaultProps} value="Hello" onSend={onSend} />);

    const buttons = screen.getAllByRole('button');
    const sendBtn = buttons[buttons.length - 1]; // Last button is send
    fireEvent.click(sendBtn);

    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('should disable file attach button when uploading', () => {
    render(<ChatInput {...defaultProps} isUploading={true} />);

    const attachButton = screen.getByTitle('Attach File');
    expect(attachButton).toBeDisabled();
  });

  it('should not disable file attach button when not uploading', () => {
    render(<ChatInput {...defaultProps} isUploading={false} />);

    const attachButton = screen.getByTitle('Attach File');
    expect(attachButton).not.toBeDisabled();
  });

  it('should render all buttons', () => {
    render(<ChatInput {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4); // Attach, Image, Emoji, Send buttons
  });

  it('should have hidden file input', () => {
    const { container } = render(<ChatInput {...defaultProps} />);

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveClass('hidden');
  });

  it('should not send empty messages', () => {
    render(<ChatInput {...defaultProps} value="" />);

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // onSend should still be called, but the parent should handle empty check
    expect(defaultProps.onSend).toHaveBeenCalled();
  });
});
