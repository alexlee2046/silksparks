import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Auth } from "@/components/Auth";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      exit,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    button: ({
      children,
      whileHover,
      whileTap,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Supabase auth
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();

vi.mock("@/services/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: (params: unknown) => mockSignInWithPassword(params),
      signUp: (params: unknown) => mockSignUp(params),
    },
  },
}));

describe("Auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockSignUp.mockResolvedValue({ data: {}, error: null });
  });

  describe("rendering", () => {
    it("should render login form by default", () => {
      render(<Auth />);

      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
      expect(screen.getByText("Continue your celestial journey.")).toBeInTheDocument();
    });

    it("should render email input", () => {
      render(<Auth />);

      expect(screen.getByPlaceholderText("seeker@silkspark.com")).toBeInTheDocument();
    });

    it("should render password input", () => {
      render(<Auth />);

      expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    });

    it("should render sign in button", () => {
      render(<Auth />);

      expect(screen.getByText("Sign In")).toBeInTheDocument();
    });

    it("should render switch to sign up link", () => {
      render(<Auth />);

      expect(screen.getByText("Don't have an account? Sign Up")).toBeInTheDocument();
    });

    it("should render close button", () => {
      const onClose = vi.fn();
      render(<Auth onClose={onClose} />);

      const closeButton = document.querySelector('.material-symbols-outlined');
      expect(closeButton?.textContent).toBe("close");
    });
  });

  describe("switching forms", () => {
    it("should switch to sign up form when clicking sign up link", () => {
      render(<Auth />);

      fireEvent.click(screen.getByText("Don't have an account? Sign Up"));

      expect(screen.getByText("Join the Cosmos")).toBeInTheDocument();
      expect(screen.getByText("Create your astral profile today.")).toBeInTheDocument();
    });

    it("should show full name field in sign up mode", () => {
      render(<Auth />);

      fireEvent.click(screen.getByText("Don't have an account? Sign Up"));

      expect(screen.getByPlaceholderText("Arjun Sharma")).toBeInTheDocument();
    });

    it("should switch button text to Create Account", () => {
      render(<Auth />);

      fireEvent.click(screen.getByText("Don't have an account? Sign Up"));

      expect(screen.getByText("Create Account")).toBeInTheDocument();
    });

    it("should switch back to login form", () => {
      render(<Auth />);

      fireEvent.click(screen.getByText("Don't have an account? Sign Up"));
      fireEvent.click(screen.getByText("Already have an account? Sign In"));

      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    });
  });

  describe("login functionality", () => {
    it("should call signInWithPassword on login form submit", async () => {
      render(<Auth />);

      fireEvent.change(screen.getByPlaceholderText("seeker@silkspark.com"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "password123" },
      });

      fireEvent.submit(screen.getByRole("button", { name: "Sign In" }));

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    it("should call onClose after successful login", async () => {
      const onClose = vi.fn();
      render(<Auth onClose={onClose} />);

      fireEvent.change(screen.getByPlaceholderText("seeker@silkspark.com"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "password123" },
      });

      fireEvent.submit(screen.getByRole("button", { name: "Sign In" }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it("should show error message on login failure", async () => {
      mockSignInWithPassword.mockResolvedValue({ error: { message: "Invalid credentials" } });

      render(<Auth />);

      fireEvent.change(screen.getByPlaceholderText("seeker@silkspark.com"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "wrongpass" },
      });

      fireEvent.submit(screen.getByRole("button", { name: "Sign In" }));

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });

    it("should show processing text while loading", async () => {
      mockSignInWithPassword.mockReturnValue(new Promise(() => {}));

      render(<Auth />);

      fireEvent.change(screen.getByPlaceholderText("seeker@silkspark.com"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "password123" },
      });

      fireEvent.submit(screen.getByRole("button", { name: "Sign In" }));

      expect(screen.getByText("Processing...")).toBeInTheDocument();
    });
  });

  describe("sign up functionality", () => {
    it("should call signUp on sign up form submit", async () => {
      render(<Auth />);

      fireEvent.click(screen.getByText("Don't have an account? Sign Up"));

      fireEvent.change(screen.getByPlaceholderText("Arjun Sharma"), {
        target: { value: "John Doe" },
      });
      fireEvent.change(screen.getByPlaceholderText("seeker@silkspark.com"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "password123" },
      });

      fireEvent.submit(screen.getByRole("button", { name: "Create Account" }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
          options: {
            data: {
              full_name: "John Doe",
            },
          },
        });
      });
    });

    it("should show success message after sign up", async () => {
      render(<Auth />);

      fireEvent.click(screen.getByText("Don't have an account? Sign Up"));

      fireEvent.change(screen.getByPlaceholderText("Arjun Sharma"), {
        target: { value: "John Doe" },
      });
      fireEvent.change(screen.getByPlaceholderText("seeker@silkspark.com"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "password123" },
      });

      fireEvent.submit(screen.getByRole("button", { name: "Create Account" }));

      await waitFor(() => {
        expect(screen.getByText("Check your email for the confirmation link!")).toBeInTheDocument();
      });
    });

    it("should show error message on sign up failure", async () => {
      mockSignUp.mockResolvedValue({ error: { message: "Email already registered" } });

      render(<Auth />);

      fireEvent.click(screen.getByText("Don't have an account? Sign Up"));

      fireEvent.change(screen.getByPlaceholderText("Arjun Sharma"), {
        target: { value: "John Doe" },
      });
      fireEvent.change(screen.getByPlaceholderText("seeker@silkspark.com"), {
        target: { value: "existing@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "password123" },
      });

      fireEvent.submit(screen.getByRole("button", { name: "Create Account" }));

      await waitFor(() => {
        expect(screen.getByText("Email already registered")).toBeInTheDocument();
      });
    });
  });

  describe("close button", () => {
    it("should call onClose when close button is clicked", () => {
      const onClose = vi.fn();
      render(<Auth onClose={onClose} />);

      // Find and click close button
      const buttons = document.querySelectorAll("button");
      const closeButton = Array.from(buttons).find((btn) =>
        btn.querySelector(".material-symbols-outlined")?.textContent === "close"
      );

      if (closeButton) {
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalled();
      }
    });
  });

  describe("form validation", () => {
    it("should have required email field", () => {
      render(<Auth />);

      const emailInput = screen.getByPlaceholderText("seeker@silkspark.com");
      expect(emailInput).toHaveAttribute("required");
    });

    it("should have required password field", () => {
      render(<Auth />);

      const passwordInput = screen.getByPlaceholderText("••••••••");
      expect(passwordInput).toHaveAttribute("required");
    });

    it("should have email type on email input", () => {
      render(<Auth />);

      const emailInput = screen.getByPlaceholderText("seeker@silkspark.com");
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("should have password type on password input", () => {
      render(<Auth />);

      const passwordInput = screen.getByPlaceholderText("••••••••");
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });
});
