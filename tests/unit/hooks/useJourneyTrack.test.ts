import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useJourneyTrack } from "../../../hooks/useJourneyTrack";

// Mock supabase
vi.mock("../../../services/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

// Mock useUser
vi.mock("../../../context/UserContext", () => ({
  useUser: () => ({
    session: null,
  }),
}));

describe("useJourneyTrack", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns a track function", () => {
    const { result } = renderHook(() => useJourneyTrack());
    expect(typeof result.current.track).toBe("function");
  });

  it("generates and persists a session ID", () => {
    const { result } = renderHook(() => useJourneyTrack());
    result.current.track("first_visit", {});
    const sessionId = localStorage.getItem("silksparks_session_id");
    expect(sessionId).toBeTruthy();
    expect(sessionId!.length).toBeGreaterThan(10);
  });
});
