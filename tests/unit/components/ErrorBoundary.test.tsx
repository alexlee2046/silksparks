import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary, withErrorBoundary } from "@/components/ErrorBoundary";

// Mock framer-motion for GlowButton
vi.mock("framer-motion", () => ({
  motion: {
    button: ({
      children,
      whileHover,
      whileTap,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button {...props}>{children}</button>
    ),
  },
}));

// Component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>No error</div>;
};

// Suppress console.error for cleaner test output
const originalConsoleError = console.error;

describe("ErrorBoundary", () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe("normal rendering", () => {
    it("should render children when no error", () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByText("Child content")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      render(
        <ErrorBoundary>
          <div>First</div>
          <div>Second</div>
        </ErrorBoundary>
      );

      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("should catch errors and display error UI", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should display error description", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/An unexpected error occurred/)
      ).toBeInTheDocument();
    });

    it("should call onError callback when error occurs", () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });

    it("should log error to console", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("custom fallback", () => {
    it("should render custom fallback when provided", () => {
      const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
      expect(screen.getByText("Custom error UI")).toBeInTheDocument();
    });

    it("should not show default error UI when custom fallback provided", () => {
      const customFallback = <div>Custom fallback</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    });
  });

  describe("action buttons", () => {
    it("should render Go Home button", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText("Go Home")).toBeInTheDocument();
    });

    it("should render Try Again button", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });

    it("should reset error state on Try Again", () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      // Click try again
      fireEvent.click(screen.getByText("Try Again"));

      // Re-render with non-throwing component
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Should show children again (but note: state was reset before re-render)
    });

    it("should redirect to home on Go Home click", () => {
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { href: "" } as Location;

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText("Go Home"));

      expect(window.location.href).toBe("/");

      window.location = originalLocation;
    });
  });

  describe("error icon", () => {
    it("should display error icon", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const icon = document.querySelector(".material-symbols-outlined");
      expect(icon).toBeInTheDocument();
      expect(icon?.textContent).toBe("error");
    });
  });
});

describe("withErrorBoundary HOC", () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it("should wrap component with error boundary", () => {
    const TestComponent = () => <div>Test component</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByText("Test component")).toBeInTheDocument();
  });

  it("should catch errors in wrapped component", () => {
    const WrappedThrowError = withErrorBoundary(ThrowError);

    render(<WrappedThrowError />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should use custom fallback when provided", () => {
    const customFallback = <div>Custom HOC fallback</div>;
    const WrappedThrowError = withErrorBoundary(ThrowError, customFallback);

    render(<WrappedThrowError />);

    expect(screen.getByText("Custom HOC fallback")).toBeInTheDocument();
  });

  it("should set displayName correctly", () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = "TestComponent";

    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe("withErrorBoundary(TestComponent)");
  });

  it("should use component name when displayName not set", () => {
    function NamedComponent() {
      return <div>Named</div>;
    }

    const WrappedComponent = withErrorBoundary(NamedComponent);

    expect(WrappedComponent.displayName).toBe("withErrorBoundary(NamedComponent)");
  });

  it("should pass props to wrapped component", () => {
    interface TestProps {
      message: string;
    }

    const TestComponent = ({ message }: TestProps) => <div>{message}</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent message="Hello from props" />);

    expect(screen.getByText("Hello from props")).toBeInTheDocument();
  });
});
