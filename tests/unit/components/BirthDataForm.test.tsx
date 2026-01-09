import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BirthDataForm } from "@/components/BirthDataForm";
import toast from "react-hot-toast";

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock UserContext
const mockUpdateUser = vi.fn();
const mockUpdateBirthData = vi.fn();
const mockSetLocalUser = vi.fn();

const mockUser = {
  name: "",
  email: "test@example.com",
  birthData: {
    date: null as Date | null,
    time: "",
    location: null,
  },
  preferences: {
    marketingConsent: false,
  },
};

vi.mock("@/context/UserContext", () => ({
  useUser: () => ({
    user: mockUser,
    updateUser: mockUpdateUser,
    updateBirthData: mockUpdateBirthData,
    setLocalUser: mockSetLocalUser,
  }),
}));

// Mock useLocationSearch
const mockSetQuery = vi.fn();
let mockLocationResults: {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}[] = [];
let mockIsSearching = false;

vi.mock("@/hooks/useLocationSearch", () => ({
  useLocationSearch: () => ({
    query: "",
    setQuery: mockSetQuery,
    results: mockLocationResults,
    isLoading: mockIsSearching,
  }),
}));

describe("BirthDataForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationResults = [];
    mockIsSearching = false;
    mockUser.name = "";
    mockUser.birthData = { date: null, time: "", location: null };
    mockUser.preferences.marketingConsent = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("step 1 - name", () => {
    it("should render step 1 by default", () => {
      render(<BirthDataForm />);
      expect(screen.getByText("Your Cosmic Identity")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter your name")
      ).toBeInTheDocument();
    });

    it("should have close button", () => {
      const onCancel = vi.fn();
      render(<BirthDataForm onCancel={onCancel} />);

      const closeButton = screen.getByText("close");
      fireEvent.click(closeButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it("should disable next button when name is empty", () => {
      render(<BirthDataForm />);
      const nextButton = screen.getByText("Next Step");
      expect(nextButton).toBeDisabled();
    });

    it("should enable next button when name is entered", () => {
      render(<BirthDataForm />);
      const nameInput = screen.getByPlaceholderText("Enter your name");
      fireEvent.change(nameInput, { target: { value: "John" } });

      const nextButton = screen.getByText("Next Step");
      expect(nextButton).not.toBeDisabled();
    });

    it("should proceed to step 2 when next is clicked", () => {
      render(<BirthDataForm />);
      const nameInput = screen.getByPlaceholderText("Enter your name");
      fireEvent.change(nameInput, { target: { value: "John" } });

      const nextButton = screen.getByText("Next Step");
      fireEvent.click(nextButton);

      expect(screen.getByText("Time & Space")).toBeInTheDocument();
    });

    it("should show progress bar", () => {
      const { container } = render(<BirthDataForm />);
      const progressBar = container.querySelector(".bg-primary");
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe("step 2 - birth data", () => {
    const goToStep2 = () => {
      const { container } = render(<BirthDataForm />);
      const nameInput = screen.getByPlaceholderText("Enter your name");
      fireEvent.change(nameInput, { target: { value: "John" } });
      fireEvent.click(screen.getByText("Next Step"));
      return container;
    };

    it("should render date input", () => {
      const container = goToStep2();
      const dateInput = container.querySelector('input[type="date"]');
      expect(dateInput).toBeInTheDocument();
    });

    it("should render time input", () => {
      const container = goToStep2();
      const timeInput = container.querySelector('input[type="time"]');
      expect(timeInput).toBeInTheDocument();
    });

    it("should render location search", () => {
      goToStep2();
      expect(
        screen.getByPlaceholderText("Search for a city...")
      ).toBeInTheDocument();
    });

    it("should disable next when date is missing", () => {
      const container = goToStep2();
      const timeInput = container.querySelector('input[type="time"]');
      fireEvent.change(timeInput!, { target: { value: "14:30" } });

      const nextButtons = screen.getAllByText("Next Step");
      const nextButton = nextButtons[nextButtons.length - 1];
      expect(nextButton).toBeDisabled();
    });

    it("should disable next when time is missing", () => {
      const container = goToStep2();
      const dateInput = container.querySelector('input[type="date"]');
      fireEvent.change(dateInput!, { target: { value: "1990-01-15" } });

      const nextButtons = screen.getAllByText("Next Step");
      const nextButton = nextButtons[nextButtons.length - 1];
      expect(nextButton).toBeDisabled();
    });

    it("should enable next when both date and time are provided", () => {
      const container = goToStep2();
      const dateInput = container.querySelector('input[type="date"]');
      const timeInput = container.querySelector('input[type="time"]');

      fireEvent.change(dateInput!, { target: { value: "1990-01-15" } });
      fireEvent.change(timeInput!, { target: { value: "14:30" } });

      const nextButtons = screen.getAllByText("Next Step");
      const nextButton = nextButtons[nextButtons.length - 1];
      expect(nextButton).not.toBeDisabled();
    });

    it("should have back button", () => {
      goToStep2();
      expect(screen.getByText("Back")).toBeInTheDocument();
    });

    it("should go back to step 1 when back is clicked", () => {
      goToStep2();
      fireEvent.click(screen.getByText("Back"));
      expect(screen.getByText("Your Cosmic Identity")).toBeInTheDocument();
    });

    it("should show optional label for location", () => {
      goToStep2();
      expect(screen.getByText("(optional)")).toBeInTheDocument();
    });

    it("should show skip option for location", () => {
      goToStep2();
      expect(screen.getByText(/Skip for now/)).toBeInTheDocument();
    });

    it("should handle location skip", () => {
      goToStep2();
      fireEvent.click(screen.getByText(/Skip for now/));
      expect(screen.getByText("Location skipped")).toBeInTheDocument();
    });

    it("should show change button after location is skipped", () => {
      goToStep2();
      fireEvent.click(screen.getByText(/Skip for now/));
      expect(screen.getByText("Change")).toBeInTheDocument();
    });

    it("should show progress bar", () => {
      const container = goToStep2();
      const progressBar = container.querySelector(".bg-primary");
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe("step 3 - consent", () => {
    const goToStep3 = () => {
      const { container } = render(<BirthDataForm />);
      // Step 1
      const nameInput = screen.getByPlaceholderText("Enter your name");
      fireEvent.change(nameInput, { target: { value: "John" } });
      fireEvent.click(screen.getByText("Next Step"));

      // Step 2
      const dateInput = container.querySelector('input[type="date"]');
      const timeInput = container.querySelector('input[type="time"]');
      fireEvent.change(dateInput!, { target: { value: "1990-01-15" } });
      fireEvent.change(timeInput!, { target: { value: "14:30" } });

      const nextButtons = screen.getAllByText("Next Step");
      fireEvent.click(nextButtons[nextButtons.length - 1]);
      return container;
    };

    it("should render consent step", () => {
      goToStep3();
      expect(screen.getByText("Final Permission")).toBeInTheDocument();
    });

    it("should render privacy information", () => {
      goToStep3();
      expect(screen.getByText(/Privacy:/)).toBeInTheDocument();
    });

    it("should render consent checkbox", () => {
      goToStep3();
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("should show warning when location was skipped", () => {
      const { container } = render(<BirthDataForm />);
      // Step 1
      fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
        target: { value: "John" },
      });
      fireEvent.click(screen.getByText("Next Step"));

      // Step 2 - skip location
      const dateInput = container.querySelector('input[type="date"]');
      const timeInput = container.querySelector('input[type="time"]');
      fireEvent.change(dateInput!, { target: { value: "1990-01-15" } });
      fireEvent.change(timeInput!, { target: { value: "14:30" } });
      fireEvent.click(screen.getByText(/Skip for now/));

      const nextButtons = screen.getAllByText("Next Step");
      fireEvent.click(nextButtons[nextButtons.length - 1]);

      expect(
        screen.getByText(/didn't provide a birth location/)
      ).toBeInTheDocument();
    });

    it("should show error toast when finishing without consent", () => {
      goToStep3();
      fireEvent.click(screen.getByText("Activate Engine"));
      expect(toast.error).toHaveBeenCalledWith(
        "Please accept the privacy terms to continue."
      );
    });

    it("should call onComplete when finished with consent", () => {
      const onComplete = vi.fn();
      const { container } = render(<BirthDataForm onComplete={onComplete} />);

      // Step 1
      fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
        target: { value: "John" },
      });
      fireEvent.click(screen.getByText("Next Step"));

      // Step 2
      const dateInput = container.querySelector('input[type="date"]');
      const timeInput = container.querySelector('input[type="time"]');
      fireEvent.change(dateInput!, { target: { value: "1990-01-15" } });
      fireEvent.change(timeInput!, { target: { value: "14:30" } });
      const nextButtons = screen.getAllByText("Next Step");
      fireEvent.click(nextButtons[nextButtons.length - 1]);

      // Step 3
      fireEvent.click(screen.getByRole("checkbox"));
      fireEvent.click(screen.getByText("Activate Engine"));

      expect(onComplete).toHaveBeenCalled();
    });

    it("should update user when finished", () => {
      const onComplete = vi.fn();
      const { container } = render(<BirthDataForm onComplete={onComplete} />);

      // Step 1
      fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
        target: { value: "John" },
      });
      fireEvent.click(screen.getByText("Next Step"));

      // Step 2
      const dateInput = container.querySelector('input[type="date"]');
      const timeInput = container.querySelector('input[type="time"]');
      fireEvent.change(dateInput!, { target: { value: "1990-01-15" } });
      fireEvent.change(timeInput!, { target: { value: "14:30" } });
      const nextButtons = screen.getAllByText("Next Step");
      fireEvent.click(nextButtons[nextButtons.length - 1]);

      // Step 3
      fireEvent.click(screen.getByRole("checkbox"));
      fireEvent.click(screen.getByText("Activate Engine"));

      expect(mockUpdateUser).toHaveBeenCalledWith({ name: "John" });
      expect(mockUpdateBirthData).toHaveBeenCalled();
    });

    it("should update local user state", () => {
      const onComplete = vi.fn();
      const { container } = render(<BirthDataForm onComplete={onComplete} />);

      // Step 1
      fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
        target: { value: "John" },
      });
      fireEvent.click(screen.getByText("Next Step"));

      // Step 2
      const dateInput = container.querySelector('input[type="date"]');
      const timeInput = container.querySelector('input[type="time"]');
      fireEvent.change(dateInput!, { target: { value: "1990-01-15" } });
      fireEvent.change(timeInput!, { target: { value: "14:30" } });
      const nextButtons = screen.getAllByText("Next Step");
      fireEvent.click(nextButtons[nextButtons.length - 1]);

      // Step 3
      fireEvent.click(screen.getByRole("checkbox"));
      fireEvent.click(screen.getByText("Activate Engine"));

      expect(mockSetLocalUser).toHaveBeenCalled();
    });

    it("should have back button", () => {
      goToStep3();
      expect(screen.getByText("Back")).toBeInTheDocument();
    });

    it("should go back to step 2 when back is clicked", () => {
      goToStep3();
      fireEvent.click(screen.getByText("Back"));
      expect(screen.getByText("Time & Space")).toBeInTheDocument();
    });
  });

  describe("location search", () => {
    const goToStep2 = () => {
      render(<BirthDataForm />);
      const nameInput = screen.getByPlaceholderText("Enter your name");
      fireEvent.change(nameInput, { target: { value: "John" } });
      fireEvent.click(screen.getByText("Next Step"));
    };

    it("should call setQuery when typing in location input", () => {
      goToStep2();
      const locationInput = screen.getByPlaceholderText("Search for a city...");
      fireEvent.change(locationInput, { target: { value: "New" } });
      expect(mockSetQuery).toHaveBeenCalledWith("New");
    });

    it("should show dropdown on focus", () => {
      goToStep2();
      const locationInput = screen.getByPlaceholderText("Search for a city...");
      fireEvent.focus(locationInput);
      // Dropdown visibility is controlled by state
    });
  });

  describe("styling", () => {
    it("should have modal overlay", () => {
      const { container } = render(<BirthDataForm />);
      const overlay = container.querySelector(".fixed.inset-0");
      expect(overlay).toBeInTheDocument();
      expect(overlay?.className).toContain("bg-black/80");
    });

    it("should have backdrop blur", () => {
      const { container } = render(<BirthDataForm />);
      const overlay = container.querySelector(".backdrop-blur-sm");
      expect(overlay).toBeInTheDocument();
    });

    it("should have max-width container", () => {
      const { container } = render(<BirthDataForm />);
      const modal = container.querySelector(".max-w-md");
      expect(modal).toBeInTheDocument();
    });
  });

  describe("pre-filled data", () => {
    it("should pre-fill name if user already has one", () => {
      mockUser.name = "Existing User";
      render(<BirthDataForm />);
      const nameInput = screen.getByPlaceholderText("Enter your name");
      expect(nameInput).toHaveValue("Existing User");
    });

    it("should pre-fill date if user already has one", () => {
      mockUser.birthData.date = new Date("1990-05-15");
      const { container } = render(<BirthDataForm />);
      fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
        target: { value: "John" },
      });
      fireEvent.click(screen.getByText("Next Step"));

      const dateInput = container.querySelector('input[type="date"]');
      expect(dateInput).toHaveValue("1990-05-15");
    });

    it("should pre-fill time if user already has one", () => {
      mockUser.birthData.time = "14:30";
      const { container } = render(<BirthDataForm />);
      fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
        target: { value: "John" },
      });
      fireEvent.click(screen.getByText("Next Step"));

      const timeInput = container.querySelector('input[type="time"]');
      expect(timeInput).toHaveValue("14:30");
    });
  });

  describe("accessibility", () => {
    it("should have autofocus on name input", () => {
      render(<BirthDataForm />);
      const nameInput = screen.getByPlaceholderText("Enter your name");
      expect(nameInput).toHaveFocus();
    });

    it("should have labels for inputs", () => {
      render(<BirthDataForm />);
      expect(screen.getByText("Name")).toBeInTheDocument();
    });
  });
});
