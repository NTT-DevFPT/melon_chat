import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fc from 'fast-check';
import { ErrorBoundary, ErrorFallback } from './ErrorBoundary';

// Component that throws an error when rendered
const ThrowError: React.FC<{ error: Error }> = ({ error }) => {
  throw error;
};

// Component that doesn't throw an error
const NoError: React.FC<{ content: string }> = ({ content }) => {
  return <div data-testid="no-error-content">{content}</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests since we're intentionally throwing errors
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  afterEach(() => {
    cleanup();
  });

  describe('Property 4: Error boundaries catch errors', () => {
    it('should catch any thrown error and render fallback UI', () => {
      /**
       * **Feature: melon-chat-improvements, Property 4: Error boundaries catch errors**
       * **Validates: Requirements 3.4**
       *
       * Property: For any error thrown by a child component, the ErrorBoundary
       * should catch it and render the fallback UI instead of crashing.
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0), // Generate random error messages, excluding whitespace-only
          (errorMessage) => {
            const error = new Error(errorMessage);

            // Render a component that throws an error inside ErrorBoundary
            const { container, unmount } = render(
              <ErrorBoundary>
                <ThrowError error={error} />
              </ErrorBoundary>
            );

            try {
              // The error should be caught and fallback UI should be rendered
              // Check that the fallback UI is displayed
              const fallbackElement = screen.getByRole('heading', {
                name: /something went wrong/i,
              });
              expect(fallbackElement).toBeInTheDocument();

              // Check that the error message is displayed in the fallback
              // Use a flexible text matcher that handles whitespace normalization
              // HTML collapses multiple spaces, so we normalize whitespace for comparison
              const errorMessageElement = screen.getByText(
                (content, _element) => {
                  // Normalize whitespace: trim and replace multiple spaces with single space
                  const normalizedContent = content.trim().replace(/\s+/g, ' ');
                  const normalizedError = errorMessage
                    .trim()
                    .replace(/\s+/g, ' ');
                  return normalizedContent === normalizedError;
                }
              );
              expect(errorMessageElement).toBeInTheDocument();

              // Check that retry button is present (use getByRole for button)
              const retryButton = screen.getByRole('button', {
                name: /try again/i,
              });
              expect(retryButton).toBeInTheDocument();

              // Verify the component didn't crash (container should have content)
              expect(container.innerHTML).not.toBe('');
            } finally {
              // Clean up after each property test iteration
              unmount();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render children normally when no error is thrown', () => {
      /**
       * Property: For any valid content, when no error is thrown,
       * the ErrorBoundary should render children normally.
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0), // Filter out whitespace-only strings
          (content) => {
            const { unmount } = render(
              <ErrorBoundary>
                <NoError content={content} />
              </ErrorBoundary>
            );

            try {
              // The content should be rendered normally
              const contentElement = screen.getByTestId('no-error-content');
              expect(contentElement).toBeInTheDocument();
              expect(contentElement.textContent).toBe(content);

              // The fallback UI should NOT be displayed
              const fallbackElement = screen.queryByRole('heading', {
                name: /something went wrong/i,
              });
              expect(fallbackElement).not.toBeInTheDocument();
            } finally {
              // Clean up after each property test iteration
              unmount();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('ErrorFallback component', () => {
    it('should display error message and retry button', () => {
      const error = new Error('Test error message');
      const resetError = vi.fn();

      render(<ErrorFallback error={error} resetError={resetError} />);

      // Check that error message is displayed
      expect(screen.getByText('Test error message')).toBeInTheDocument();

      // Check that heading is displayed
      expect(
        screen.getByRole('heading', { name: /something went wrong/i })
      ).toBeInTheDocument();

      // Check that retry button is present
      expect(
        screen.getByRole('button', { name: /try again/i })
      ).toBeInTheDocument();

      // Check that go home button is present
      expect(
        screen.getByRole('button', { name: /go home/i })
      ).toBeInTheDocument();
    });

    it('should call resetError when Try Again button is clicked', async () => {
      const user = userEvent.setup();
      const error = new Error('Test error');
      const resetError = vi.fn();

      render(<ErrorFallback error={error} resetError={resetError} />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      expect(resetError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom fallback', () => {
    it('should use custom fallback when provided', () => {
      const error = new Error('Custom error');
      const customFallback = (err: Error, reset: () => void) => (
        <div>
          <p>Custom fallback: {err.message}</p>
          <button onClick={reset}>Custom Reset</button>
        </div>
      );

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError error={error} />
        </ErrorBoundary>
      );

      // Check that custom fallback is rendered
      expect(
        screen.getByText(/custom fallback: custom error/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/custom reset/i)).toBeInTheDocument();

      // Default fallback should NOT be rendered
      expect(
        screen.queryByText(/something went wrong/i)
      ).not.toBeInTheDocument();
    });
  });
});
