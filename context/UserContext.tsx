import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserLocation {
    name: string;
    lat: number;
    lng: number;
}

export interface UserBirthData {
    date: Date | null;
    time: string; // "HH:mm"
    location: UserLocation | null;
}

export interface Order {
    id: string;
    date: Date;
    items: { name: string; price: number; type: 'product' | 'service'; status: string; image?: string }[];
    total: number;
    status: 'pending' | 'completed' | 'delivered';
}

export interface ArchiveItem {
    id: string;
    type: 'Astrology' | 'Tarot' | 'Five Elements';
    date: Date;
    title: string;
    summary: string;
    content: string | any;
    image?: string;
}

export interface UserProfile {
    name: string;
    email: string;
    birthData: UserBirthData;
    preferences: {
        marketingConsent: boolean;
    };
    orders: Order[];
    archives: ArchiveItem[];
}

interface UserContextType {
    user: UserProfile;
    updateUser: (updates: Partial<UserProfile>) => void;
    updateBirthData: (data: Partial<UserBirthData>) => void;
    addOrder: (order: Order) => void;
    addArchive: (item: ArchiveItem) => void;
    resetUser: () => void;
    isBirthDataComplete: boolean;
}

const defaultUser: UserProfile = {
    name: "",
    email: "",
    birthData: {
        date: null,
        time: "",
        location: null
    },
    preferences: {
        marketingConsent: false
    },
    orders: [],
    archives: []
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile>(defaultUser);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('silk_spark_user');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Date strings need to be converted back to Date objects
                if (parsed.birthData?.date) {
                    parsed.birthData.date = new Date(parsed.birthData.date);
                }
                if (parsed.orders) {
                    parsed.orders = parsed.orders.map((o: any) => ({
                        ...o,
                        date: new Date(o.date)
                    }));
                }
                if (parsed.archives) {
                    parsed.archives = parsed.archives.map((a: any) => ({
                        ...a,
                        date: new Date(a.date)
                    }));
                }
                setUser(parsed);
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem('silk_spark_user', JSON.stringify(user));
    }, [user]);

    const updateUser = (updates: Partial<UserProfile>) => {
        setUser(prev => ({ ...prev, ...updates }));
    };

    const updateBirthData = (data: Partial<UserBirthData>) => {
        setUser(prev => ({
            ...prev,
            birthData: { ...prev.birthData, ...data }
        }));
    };

    const addOrder = (order: Order) => {
        setUser(prev => ({
            ...prev,
            orders: [order, ...(prev.orders || [])]
        }));
    };

    const addArchive = (item: ArchiveItem) => {
        setUser(prev => ({
            ...prev,
            archives: [item, ...(prev.archives || [])]
        }));
    };

    const resetUser = () => {
        setUser(defaultUser);
        localStorage.removeItem('silk_spark_user');
    };

    const isBirthDataComplete = !!(
        user.name &&
        user.birthData.date &&
        user.birthData.time &&
        user.birthData.location
    );

    return (
        <UserContext.Provider value={{ user, updateUser, updateBirthData, addOrder, addArchive, resetUser, isBirthDataComplete }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
