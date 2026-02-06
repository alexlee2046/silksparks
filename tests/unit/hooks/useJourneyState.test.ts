import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useJourneyState } from "../../../hooks/useJourneyState";

// Mock useUser
vi.mock("../../../context/UserContext", () => ({
  useUser: () => ({
    session: null,
    isBirthDataComplete: false,
  }),
}));

describe("useJourneyState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("detects first visit", () => {
    const { result } = renderHook(() => useJourneyState());
    expect(result.current.isFirstVisit).toBe(true);
  });

  it("marks visit after first access", () => {
    const { result } = renderHook(() => useJourneyState());
    act(() => result.current.markVisited());
    expect(result.current.isFirstVisit).toBe(false);
  });

  it("tracks completed features", () => {
    const { result } = renderHook(() => useJourneyState());
    act(() => result.current.completeFeature("tarot"));
    expect(result.current.completedFeatures).toContain("tarot");
    expect(result.current.lastFeature).toBe("tarot");
  });

  it("does not duplicate features", () => {
    const { result } = renderHook(() => useJourneyState());
    act(() => {
      result.current.completeFeature("tarot");
      result.current.completeFeature("tarot");
    });
    expect(result.current.completedFeatures.filter((f: string) => f === "tarot").length).toBe(1);
  });

  it("returns hasAccount false when no session", () => {
    const { result } = renderHook(() => useJourneyState());
    expect(result.current.hasAccount).toBe(false);
  });

  it("returns hasBirthData false when incomplete", () => {
    const { result } = renderHook(() => useJourneyState());
    expect(result.current.hasBirthData).toBe(false);
  });

  it("suggests tarot for first-time visitor", () => {
    const { result } = renderHook(() => useJourneyState());
    expect(result.current.suggestedNext).toBe("tarot");
  });
});
