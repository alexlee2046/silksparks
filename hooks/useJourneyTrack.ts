import { useCallback, useRef } from "react";
import { supabase } from "../services/supabase";
import { useUser } from "../context/UserContext";

const SESSION_KEY = "silksparks_session_id";

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useJourneyTrack() {
  const { session } = useUser();
  const sessionIdRef = useRef(getSessionId());

  const track = useCallback(
    (eventType: string, eventData: Record<string, unknown> = {}) => {
      const payload = {
        session_id: sessionIdRef.current,
        user_id: session?.user?.id ?? null,
        event_type: eventType,
        event_data: eventData,
      };

      // Fire and forget — don't block UI
      setTimeout(() => {
        supabase.from("journey_events").insert(payload).then(({ error }) => {
          if (error) console.warn("[JourneyTrack]", error.message);
        });
      }, 0);
    },
    [session?.user?.id],
  );

  return { track };
}
