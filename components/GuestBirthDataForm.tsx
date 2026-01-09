/**
 * GuestBirthDataForm - 访客生日输入表单
 *
 * 简化版 BirthDataForm，用于未登录用户体验星盘功能
 * - 只收集必要数据：日期、时间、地点（可选）
 * - 数据存储在 localStorage，不上传服务器
 * - 完成后引导用户体验星盘
 */

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocationSearch } from "../hooks/useLocationSearch";
import { LocationResult } from "../services/LocationSearchService";
import type { UserLocation, UserBirthData } from "../context/UserContext";
import * as m from "../src/paraglide/messages";

interface Props {
  onComplete: (data: Partial<UserBirthData>) => void;
  onCancel: () => void;
}

export const GuestBirthDataForm: React.FC<Props> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [tempDate, setTempDate] = useState("");
  const [tempTime, setTempTime] = useState("");
  const [tempLocation, setTempLocation] = useState<UserLocation | null>(null);
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

  const handleFinish = () => {
    onComplete({
      date: tempDate ? new Date(tempDate) : null,
      time: tempTime,
      location: tempLocation,
    });
  };

  const canProceedFromStep1 = tempDate && tempTime;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-surface border border-surface-border rounded-xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 relative"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-text-muted hover:text-foreground transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-surface-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl text-primary mb-2 block">
                auto_awesome
              </span>
              <h2 className="text-2xl font-bold text-primary">
                {m["birthChart.guest.title"]()}
              </h2>
              <p className="text-text-muted text-sm mt-2">
                {m["birthChart.guest.description"]()}
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-muted uppercase">
                  {m["birthChart.form.birthDate"]()}
                </label>
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="w-full bg-background border border-surface-border rounded-lg p-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-muted uppercase">
                  {m["birthChart.form.birthTime"]()}
                </label>
                <input
                  type="time"
                  value={tempTime}
                  onChange={(e) => setTempTime(e.target.value)}
                  className="w-full bg-background border border-surface-border rounded-lg p-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={onCancel}
                className="flex-1 border border-surface-border text-text-muted py-3 rounded-lg hover:bg-surface-border/30 transition-colors"
              >
                {m["common.cancel"]()}
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceedFromStep1}
                className="flex-1 bg-primary text-background-dark font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors"
              >
                {m["common.next"]()}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl text-primary mb-2 block">
                location_on
              </span>
              <h2 className="text-2xl font-bold text-primary">
                Birth Location
              </h2>
              <p className="text-text-muted text-sm mt-2">
                For more accurate chart (optional)
              </p>
            </div>

            <div className="relative" ref={dropdownRef}>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-muted uppercase">
                  {m["birthChart.form.birthPlace"]()}
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={locationQuery}
                    onChange={(e) => {
                      setLocationQuery(e.target.value);
                      setShowLocationDropdown(true);
                      setLocationSkipped(false);
                    }}
                    onFocus={() => setShowLocationDropdown(true)}
                    placeholder="Search city..."
                    className="w-full bg-background border border-surface-border rounded-lg p-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                  />
                  {isSearching && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined animate-spin text-text-muted">
                      progress_activity
                    </span>
                  )}
                </div>
              </div>

              {showLocationDropdown && locationResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-surface border border-surface-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {locationResults.map((result, idx) => (
                    <button
                      key={`${result.name}-${idx}`}
                      onClick={() => handleLocationSelect(result)}
                      className="w-full text-left px-4 py-3 hover:bg-surface-border/30 transition-colors text-foreground text-sm"
                    >
                      {result.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {tempLocation && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>{tempLocation.name}</span>
              </div>
            )}

            {locationSkipped && (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <span className="material-symbols-outlined text-sm">info</span>
                <span>Location skipped - using default coordinates</span>
              </div>
            )}

            <button
              onClick={handleLocationSkip}
              className="text-text-muted text-sm underline hover:text-foreground transition-colors"
            >
              Skip this step
            </button>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleBack}
                className="flex-1 border border-surface-border text-text-muted py-3 rounded-lg hover:bg-surface-border/30 transition-colors"
              >
                {m["common.back"]()}
              </button>
              <button
                onClick={handleFinish}
                disabled={!tempLocation && !locationSkipped}
                className="flex-1 bg-primary text-background-dark font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors"
              >
                {m["birthChart.guest.cta"]()}
              </button>
            </div>

            <p className="text-xs text-text-muted text-center mt-2">
              {m["birthChart.guest.localStorageNote"]()}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
