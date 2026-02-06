import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JourneyNext } from "@/components/JourneyNext";

// Mock hooks
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks/useJourneyState", () => ({
  useJourneyState: () => ({
    hasAccount: false,
    hasBirthData: false,
    completedFeatures: [],
    lastFeature: null,
    suggestedNext: "astrology",
  }),
}));

vi.mock("@/hooks/useJourneyTrack", () => ({
  useJourneyTrack: () => ({ track: vi.fn() }),
}));

describe("JourneyNext", () => {
  it("renders recommendation for tarot -> astrology", () => {
    render(<JourneyNext currentFeature="tarot" />);
    expect(screen.getByTestId("journey-next")).toBeInTheDocument();
  });

  it("can be dismissed", () => {
    render(<JourneyNext currentFeature="tarot" />);
    const dismissBtn = screen.getByLabelText("Dismiss recommendation");
    fireEvent.click(dismissBtn);
    expect(screen.queryByTestId("journey-next")).not.toBeInTheDocument();
  });
});
