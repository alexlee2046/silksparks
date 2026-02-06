import { vi } from "vitest";

// ============================================================================
// Mock Data Factories
// ============================================================================

export interface MockUser {
  id: string;
  email: string;
  created_at: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  aud?: string;
  role?: string;
}

export interface MockSession {
  user: MockUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in?: number;
  token_type?: string;
}

export interface MockProfile {
  id: string;
  name: string;
  email: string;
  birth_date: string | null;
  birth_time: string | null;
  birth_location: string | null;
  birth_latitude: number | null;
  birth_longitude: number | null;
  birth_timezone: string | null;
  points: number;
  tier: string;
  is_admin: boolean;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MockArchive {
  id: string;
  user_id: string;
  type: "astrology" | "tarot" | "consultation";
  title: string;
  content: Record<string, unknown>;
  created_at: string;
}

export interface MockProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
  is_active: boolean;
  created_at: string;
}

export interface MockOrder {
  id: string;
  user_id: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  total: number;
  items: Array<{ product_id: string; quantity: number; price: number }>;
  created_at: string;
}

export interface MockExpert {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar_url: string;
  specialties: string[];
  rating: number;
  is_available: boolean;
  price_per_min: number;
}

export interface MockAppointment {
  id: string;
  user_id: string;
  expert_id: string;
  date: string;
  time: string;
  duration: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
}

// ============================================================================
// Factory Functions
// ============================================================================

let idCounter = 0;
const generateId = () => `mock-id-${++idCounter}`;

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: generateId(),
    email: "test@example.com",
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    role: "authenticated",
    ...overrides,
  };
}

export function createMockSession(overrides: Partial<MockSession> = {}): MockSession {
  const user = overrides.user || createMockUser();
  return {
    user,
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: "bearer",
    ...overrides,
  };
}

export function createMockProfile(overrides: Partial<MockProfile> = {}): MockProfile {
  return {
    id: generateId(),
    name: "Test User",
    email: "test@example.com",
    birth_date: "1990-01-15",
    birth_time: "14:30",
    birth_location: "Beijing, China",
    birth_latitude: 39.9042,
    birth_longitude: 116.4074,
    birth_timezone: "Asia/Shanghai",
    points: 100,
    tier: "bronze",
    is_admin: false,
    preferences: { notifications: true, language: "zh" },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockArchive(overrides: Partial<MockArchive> = {}): MockArchive {
  return {
    id: generateId(),
    user_id: generateId(),
    type: "astrology",
    title: "Test Birth Chart Analysis",
    content: { planets: [], houses: [], aspects: [] },
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockProduct(overrides: Partial<MockProduct> = {}): MockProduct {
  return {
    id: generateId(),
    name: "Test Crystal",
    description: "A beautiful test crystal",
    price: 99.99,
    images: ["https://example.com/crystal.jpg"],
    category: "crystals",
    stock: 10,
    is_active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockOrder(overrides: Partial<MockOrder> = {}): MockOrder {
  return {
    id: generateId(),
    user_id: generateId(),
    status: "pending",
    total: 199.99,
    items: [{ product_id: generateId(), quantity: 2, price: 99.99 }],
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockExpert(overrides: Partial<MockExpert> = {}): MockExpert {
  return {
    id: generateId(),
    name: "Expert Zhang",
    title: "Astrology Master",
    bio: "20 years of experience in astrology",
    avatar_url: "https://example.com/avatar.jpg",
    specialties: ["birth-chart", "tarot", "feng-shui"],
    rating: 4.8,
    is_available: true,
    price_per_min: 200,
    ...overrides,
  };
}

export function createMockAppointment(overrides: Partial<MockAppointment> = {}): MockAppointment {
  return {
    id: generateId(),
    user_id: generateId(),
    expert_id: generateId(),
    date: "2025-02-15",
    time: "14:00",
    duration: 60,
    status: "pending",
    notes: null,
    ...overrides,
  };
}

// ============================================================================
// Query Builder Mock
// ============================================================================

export interface QueryBuilderConfig {
  data?: unknown;
  error?: { message: string; code?: string } | null;
  count?: number | null;
}

export function createQueryBuilder(config: QueryBuilderConfig = {}) {
  const { data = [], error = null, count = null } = config;

  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
    csv: vi.fn().mockResolvedValue({ data, error }),
    geojson: vi.fn().mockResolvedValue({ data, error }),
    explain: vi.fn().mockResolvedValue({ data, error }),
    rollback: vi.fn().mockResolvedValue({ data, error }),
    returns: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) =>
      resolve({ data, error, count })
    ),
  };

  return builder;
}

// ============================================================================
// Supabase Client Mock Factory
// ============================================================================

export interface SupabaseClientConfig {
  session?: MockSession | null;
  user?: MockUser | null;
  authError?: { message: string } | null;
  queryConfigs?: Record<string, QueryBuilderConfig>;
}

export function createMockSupabaseClient(config: SupabaseClientConfig = {}) {
  const { session = null, user = null, authError = null, queryConfigs = {} } = config;

  const authStateChangeCallbacks: Array<(event: string, session: MockSession | null) => void> = [];

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session },
        error: authError,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: session?.user || user },
        error: authError,
      }),
      signInWithPassword: vi.fn().mockImplementation(async ({ email, password }) => {
        if (email === "test@example.com" && password === "password123") {
          const mockSession = createMockSession({ user: createMockUser({ email }) });
          return { data: { session: mockSession, user: mockSession.user }, error: null };
        }
        return { data: { session: null, user: null }, error: { message: "Invalid credentials" } };
      }),
      signUp: vi.fn().mockImplementation(async ({ email }) => {
        const mockUser = createMockUser({ email });
        const mockSession = createMockSession({ user: mockUser });
        return { data: { session: mockSession, user: mockUser }, error: null };
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: { url: "https://oauth.example.com" }, error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      onAuthStateChange: vi.fn().mockImplementation((callback) => {
        authStateChangeCallbacks.push(callback);
        // Immediately call with current session
        callback(session ? "SIGNED_IN" : "SIGNED_OUT", session);
        return {
          data: {
            subscription: {
              id: "mock-subscription-id",
              unsubscribe: vi.fn(),
            },
          },
        };
      }),
      // Helper to trigger auth state changes in tests
      _triggerAuthStateChange: (event: string, newSession: MockSession | null) => {
        authStateChangeCallbacks.forEach((cb) => cb(event, newSession));
      },
    },
    from: vi.fn().mockImplementation((table: string) => {
      const tableConfig = queryConfigs[table] || {};
      return createQueryBuilder(tableConfig);
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: "test-path" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/test.jpg" } }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        move: vi.fn().mockResolvedValue({ data: null, error: null }),
        copy: vi.fn().mockResolvedValue({ data: null, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.com/signed" }, error: null }),
      }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({
        unsubscribe: vi.fn(),
      }),
    }),
    removeChannel: vi.fn().mockResolvedValue({ error: null }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

// ============================================================================
// Reset Helper
// ============================================================================

export function resetIdCounter() {
  idCounter = 0;
}
