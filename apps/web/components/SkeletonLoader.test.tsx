import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonLoader } from './SkeletonLoader';

describe('SkeletonLoader', () => {
  it('should render with default props', () => {
    const { container } = render(<SkeletonLoader />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toBeTruthy();
    expect(skeleton.className).toContain('animate-pulse');
    expect(skeleton.className).toContain('bg-gradient-to-r');
  });

  it('should render with circular variant', () => {
    const { container } = render(<SkeletonLoader variant="circular" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton.className).toContain('rounded-full');
  });

  it('should render with text variant', () => {
    const { container } = render(<SkeletonLoader variant="text" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton.className).toContain('rounded');
  });

  it('should render with rectangular variant', () => {
    const { container } = render(<SkeletonLoader variant="rectangular" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton.className).toContain('rounded-lg');
  });

  it('should apply custom width and height', () => {
    const { container } = render(
      <SkeletonLoader width="200px" height="50px" />
    );
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton.style.width).toBe('200px');
    expect(skeleton.style.height).toBe('50px');
  });

  it('should apply custom className', () => {
    const { container } = render(<SkeletonLoader className="custom-class" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton.className).toContain('custom-class');
  });
});
