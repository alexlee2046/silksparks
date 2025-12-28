import React, { useState } from 'react';
import { useUser, UserLocation } from '../context/UserContext';

interface Props {
    onComplete?: () => void;
    onCancel?: () => void;
}

export const BirthDataForm: React.FC<Props> = ({ onComplete, onCancel }) => {
    const { user, updateUser, updateBirthData } = useUser();
    const [step, setStep] = useState(1);
    const [tempDate, setTempDate] = useState(user.birthData.date ? user.birthData.date.toISOString().split('T')[0] : '');

    // Mock locations for MVP
    const MOCK_LOCATIONS: UserLocation[] = [
        { name: "New York, USA", lat: 40.7128, lng: -74.0060 },
        { name: "London, UK", lat: 51.5074, lng: -0.1278 },
        { name: "Paris, France", lat: 48.8566, lng: 2.3522 },
        { name: "Tokyo, Japan", lat: 35.6762, lng: 139.6503 },
        { name: "Shanghai, China", lat: 31.2304, lng: 121.4737 },
    ];

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleFinish = () => {
        if (!user.preferences.marketingConsent) {
            alert("Please accept the privacy terms to continue.");
            return;
        }
        // Finalize date
        if (tempDate) {
            updateBirthData({ date: new Date(tempDate) });
        }
        if (onComplete) onComplete();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-surface-dark border border-surface-border rounded-xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 relative">
                <button onClick={onCancel} className="absolute top-4 right-4 text-text-muted hover:text-white">
                    <span className="material-symbols-outlined">close</span>
                </button>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-surface-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }}></div>
                </div>

                {step === 1 && (
                    <div className="flex flex-col gap-4 animate-fade-in-up">
                        <h2 className="text-2xl font-bold text-white text-center">Your Cosmic Identity</h2>
                        <p className="text-text-muted text-center text-sm">Let's start with your name.</p>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Name</label>
                            <input
                                type="text"
                                value={user.name}
                                onChange={(e) => updateUser({ name: e.target.value })}
                                className="bg-black/20 border border-surface-border rounded-lg p-3 text-white focus:border-primary outline-none transition-colors"
                                placeholder="Enter your name"
                                autoFocus
                            />
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={!user.name}
                            className="mt-4 bg-primary text-background-dark font-bold py-3 rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Next Step
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex flex-col gap-4 animate-fade-in-up">
                        <h2 className="text-2xl font-bold text-white text-center">Time & Space</h2>
                        <p className="text-text-muted text-center text-sm">When and where did your journey begin?</p>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Date of Birth</label>
                            <input
                                type="date"
                                value={tempDate}
                                onChange={(e) => setTempDate(e.target.value)}
                                className="bg-black/20 border border-surface-border rounded-lg p-3 text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Time of Birth</label>
                            <input
                                type="time"
                                value={user.birthData.time}
                                onChange={(e) => updateBirthData({ time: e.target.value })}
                                className="bg-black/20 border border-surface-border rounded-lg p-3 text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Place of Birth</label>
                            <select
                                value={user.birthData.location?.name || ""}
                                onChange={(e) => {
                                    const loc = MOCK_LOCATIONS.find(l => l.name === e.target.value);
                                    if (loc) updateBirthData({ location: loc });
                                }}
                                className="bg-black/20 border border-surface-border rounded-lg p-3 text-white focus:border-primary outline-none appearance-none"
                            >
                                <option value="" disabled>Select a location</option>
                                {MOCK_LOCATIONS.map(loc => (
                                    <option key={loc.name} value={loc.name}>{loc.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button onClick={handleBack} className="flex-1 bg-transparent border border-surface-border text-white font-bold py-3 rounded-lg hover:border-white transition-all">Back</button>
                            <button
                                onClick={handleNext}
                                disabled={!tempDate || !user.birthData.time || !user.birthData.location}
                                className="flex-1 bg-primary text-background-dark font-bold py-3 rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-all"
                            >
                                Next Step
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col gap-4 animate-fade-in-up">
                        <h2 className="text-2xl font-bold text-white text-center">Final Permission</h2>
                        <p className="text-text-muted text-center text-sm">We value your privacy.</p>

                        <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-xs text-text-muted/80 leading-relaxed">
                            By collecting your birth data, we can provide accurate astrological insights.
                            We utilize AI to interpret your chart. Your data is stored locally on this device.
                        </div>

                        <div className="flex items-start gap-3 p-2">
                            <input
                                type="checkbox"
                                id="consent"
                                checked={user.preferences.marketingConsent}
                                onChange={(e) => {
                                    const val = e.target.checked;
                                    updateUser({ preferences: { ...user.preferences, marketingConsent: val } });
                                }}
                                className="mt-1"
                            />
                            <label htmlFor="consent" className="text-sm text-white cursor-pointer select-none">
                                I agree to the <span className="text-primary underline">Privacy Policy</span> and consent to AI processing of my birth chart.
                            </label>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button onClick={handleBack} className="flex-1 bg-transparent border border-surface-border text-white font-bold py-3 rounded-lg hover:border-white transition-all">Back</button>
                            <button
                                onClick={handleFinish}
                                className="flex-1 bg-primary text-background-dark font-bold py-3 rounded-lg hover:bg-primary-hover shadow-[0_0_15px_rgba(244,192,37,0.3)] transition-all"
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
