import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '../../utils/errorBoundary';

// Create a component that throws an error
const ErrorComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Silence console.error for cleaner test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  it('should render children when no errors occur', () => {
    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('should render default fallback UI when an error occurs', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('should render custom fallback UI when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('should call onError when an error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('should reset and render children again after clicking try again', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <ErrorBoundary>
          {shouldThrow ? (
            <div onClick={() => setShouldThrow(false)}>
              <ErrorComponent />
            </div>
          ) : (
            <div>Recovered content</div>
          )}
        </ErrorBoundary>
      );
    };

    render(<TestComponent />);

    // Error is shown
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click try again
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    // Component resets but still throws initially
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should support function as fallback', () => {
    const fallback = jest.fn((error, reset) => (
      <div>
        <p>Custom error: {error.message}</p>
        <button onClick={reset}>Custom reset</button>
      </div>
    ));

    render(
      <ErrorBoundary fallback={fallback}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(fallback).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.any(Function)
    );

    expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom reset' })).toBeInTheDocument();
  });
});
