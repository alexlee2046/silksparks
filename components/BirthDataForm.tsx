import React, { useState, useRef, useEffect } from "react";
import { useUser, UserLocation } from "../context/UserContext";
import { useLocationSearch } from "../hooks/useLocationSearch";
import { LocationResult } from "../services/LocationSearchService";
import toast from "react-hot-toast";

interface Props {
  onComplete?: () => void;
  onCancel?: () => void;
}

export const BirthDataForm: React.FC<Props> = ({ onComplete, onCancel }) => {
  const { user, updateUser, updateBirthData, setLocalUser } = useUser();
  const [step, setStep] = useState(1);
  const [tempName, setTempName] = useState(user.name || "");
  const [tempDate, setTempDate] = useState(
    user.birthData.date ? user.birthData.date.toISOString().split("T")[0] : "",
  );
  const [tempTime, setTempTime] = useState(user.birthData.time || "");
  const [tempLocation, setTempLocation] = useState<UserLocation | null>(user.birthData.location || null);
  const [tempConsent, setTempConsent] = useState(user.preferences.marketingConsent || false);
  const [locationSkipped, setLocationSkipped] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const {
    query: locationQuery,
    setQuery: setLocationQuery,
    results: locationResults,
    isLoading: isSearching,
  } = useLocationSearch({ debounceMs: 400 });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleLocationSelect = (result: LocationResult) => {
    const location: UserLocation = {
      name: result.name,
      lat: result.lat,
      lng: result.lng,
    };
    setTempLocation(location);
    setLocationQuery(result.name);
    setShowLocationDropdown(false);
    setLocationSkipped(false);
  };

  const handleLocationSkip = () => {
    setTempLocation(null);
    setLocationQuery("");
    setLocationSkipped(true);
    setShowLocationDropdown(false);
  };

  const handleLocationClear = () => {
    setTempLocation(null);
    setLocationQuery("");
    setLocationSkipped(false);
    inputRef.current?.focus();
  };

  const handleFinish = () => {
    if (!tempConsent) {
      toast.error("Please accept the privacy terms to continue.");
      return;
    }

    // Save all data at once
    if (tempName) {
      updateUser({ name: tempName });
    }

    // Update birth data
    const birthDataUpdates: Partial<{date: Date; time: string; location: UserLocation | null}> = {};
    if (tempDate) birthDataUpdates.date = new Date(tempDate);
    if (tempTime) birthDataUpdates.time = tempTime;
    // Location can be null if skipped
    birthDataUpdates.location = tempLocation;

    if (Object.keys(birthDataUpdates).length > 0) {
      updateBirthData(birthDataUpdates);
    }

    // Update preferences
    updateUser({ preferences: { ...user.preferences, marketingConsent: tempConsent } });

    // Also update local user state for immediate effect (even when not logged in)
    if (setLocalUser) {
      setLocalUser((prev: any) => ({
        ...prev,
        name: tempName || prev.name,
        birthData: { ...prev.birthData, ...birthDataUpdates },
        preferences: { ...prev.preferences, marketingConsent: tempConsent },
      }));
    }

    if (onComplete) onComplete();
  };

  // Check if we can proceed to next step (date and time required, location optional)
  const canProceedFromStep2 = tempDate && tempTime;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-surface border border-surface-border rounded-xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-text-muted hover:text-foreground"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-surface-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-primary text-center">
              Your Cosmic Identity
            </h2>
            <p className="text-text-muted text-center text-sm">
              Let's start with your name.
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-muted uppercase">
                Name
              </label>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="bg-background border border-surface-border rounded-lg p-3 text-foreground placeholder:text-text-muted focus:border-primary outline-none transition-colors"
                placeholder="Enter your name"
                autoFocus
              />
            </div>

            <button
              onClick={handleNext}
              disabled={!tempName}
              className="mt-4 bg-primary text-background font-bold py-3 rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next Step
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-primary text-center">
              Time & Space
            </h2>
            <p className="text-text-muted text-center text-sm">
              When and where did your journey begin?
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-muted uppercase">
                Date of Birth
              </label>
              <input
                type="date"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="bg-background border border-surface-border rounded-lg p-3 text-foreground focus:border-primary outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-muted uppercase">
                Time of Birth
              </label>
              <input
                type="time"
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
                className="bg-background border border-surface-border rounded-lg p-3 text-foreground focus:border-primary outline-none"
              />
            </div>

            <div className="flex flex-col gap-2" ref={dropdownRef}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-muted uppercase">
                  Place of Birth
                  <span className="text-text-muted font-normal ml-1">(optional)</span>
                </label>
                {(tempLocation || locationSkipped) && (
                  <button
                    onClick={handleLocationClear}
                    className="text-xs text-primary hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Selected location or skipped state */}
              {tempLocation ? (
                <div className="bg-background border border-primary/50 rounded-lg p-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                  <span className="text-foreground flex-1">{tempLocation.name}</span>
                  <span className="text-xs text-text-muted">
                    {tempLocation.lat.toFixed(2)}, {tempLocation.lng.toFixed(2)}
                  </span>
                </div>
              ) : locationSkipped ? (
                <div className="bg-background border border-amber-500/50 rounded-lg p-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-lg">info</span>
                  <span className="text-text-muted flex-1">Location skipped</span>
                </div>
              ) : (
                /* Search input */
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={locationQuery}
                    onChange={(e) => {
                      setLocationQuery(e.target.value);
                      setShowLocationDropdown(true);
                    }}
                    onFocus={() => setShowLocationDropdown(true)}
                    className="w-full bg-background border border-surface-border rounded-lg p-3 pr-10 text-foreground placeholder:text-text-muted focus:border-primary outline-none"
                    placeholder="Search for a city..."
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    </div>
                  )}

                  {/* Dropdown results */}
                  {showLocationDropdown && (locationResults.length > 0 || locationQuery.length >= 2) && (
                    <div className="absolute z-10 w-full mt-1 bg-surface border border-surface-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {locationResults.map((result, index) => (
                        <button
                          key={`${result.lat}-${result.lng}-${index}`}
                          onClick={() => handleLocationSelect(result)}
                          className="w-full text-left px-3 py-2 hover:bg-primary/10 transition-colors border-b border-surface-border last:border-0"
                        >
                          <div className="text-foreground text-sm">{result.name}</div>
                          <div className="text-text-muted text-xs truncate">{result.displayName}</div>
                        </button>
                      ))}
                      {locationResults.length === 0 && locationQuery.length >= 2 && !isSearching && (
                        <div className="px-3 py-2 text-text-muted text-sm">
                          No results found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Privacy notice and skip option */}
              {!tempLocation && !locationSkipped && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">info</span>
                    <p className="text-xs text-amber-200/80">
                      Birth location affects ascendant and house calculations.
                      Without it, readings will be less accurate.
                    </p>
                  </div>
                  <button
                    onClick={handleLocationSkip}
                    className="text-xs text-text-muted hover:text-foreground underline"
                  >
                    Skip for now (affects accuracy)
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleBack}
                className="flex-1 bg-transparent border border-surface-border text-foreground font-bold py-3 rounded-lg hover:border-primary transition-all"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceedFromStep2}
                className="flex-1 bg-primary text-background font-bold py-3 rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-all"
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-primary text-center">
              Final Permission
            </h2>
            <p className="text-text-muted text-center text-sm">
              We value your privacy.
            </p>

            <div className="bg-surface-border/30 rounded-lg p-4 border border-surface-border text-xs text-text-muted leading-relaxed space-y-2">
              <p>
                By collecting your birth data, we can provide accurate
                astrological insights. We utilize AI to interpret your chart.
              </p>
              <p>
                <strong className="text-foreground">Privacy:</strong> Your birth data is stored securely.
                Location data is only used for astronomical calculations and is never shared with third parties.
              </p>
            </div>

            {/* Show warning if location was skipped */}
            {!tempLocation && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">warning</span>
                <div className="text-xs text-amber-200/80">
                  <strong>Note:</strong> You didn't provide a birth location.
                  Your readings will use a default position, which may affect
                  the accuracy of house placements and rising sign calculations.
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-2">
              <input
                type="checkbox"
                id="consent"
                checked={tempConsent}
                onChange={(e) => setTempConsent(e.target.checked)}
                className="mt-1 accent-primary"
              />
              <label
                htmlFor="consent"
                className="text-sm text-foreground cursor-pointer select-none"
              >
                I agree to the{" "}
                <span className="text-primary underline">Privacy Policy</span>{" "}
                and consent to AI processing of my birth chart.
              </label>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleBack}
                className="flex-1 bg-transparent border border-surface-border text-foreground font-bold py-3 rounded-lg hover:border-primary transition-all"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 bg-primary text-background font-bold py-3 rounded-lg hover:bg-primary-hover shadow-[0_0_15px_rgba(244,192,37,0.3)] transition-all"
              >
                Activate Engine
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
