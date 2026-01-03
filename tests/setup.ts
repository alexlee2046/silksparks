import "@testing-library/jest-dom/vitest";
import { vi, beforeAll, afterEach, afterAll } from "vitest";

// Mock environment variables
vi.stubEnv("VITE_SUPABASE_URL", "https://test-project.supabase.co");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-anon-key");
vi.stubEnv("VITE_AI_PROVIDER", "gemini");
vi.stubEnv("VITE_GEMINI_API_KEY", "test-gemini-key");

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, "sessionStorage", {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, "ResizeObserver", {
  value: ResizeObserverMock,
});

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  root = null;
  rootMargin = "";
  thresholds = [];
}

Object.defineProperty(window, "IntersectionObserver", {
  value: IntersectionObserverMock,
});

// Mock scrollTo
Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
});

// Mock requestAnimationFrame
Object.defineProperty(window, "requestAnimationFrame", {
  value: (callback: FrameRequestCallback) => setTimeout(callback, 16),
});

Object.defineProperty(window, "cancelAnimationFrame", {
  value: (id: number) => clearTimeout(id),
});

// Mock Supabase client
vi.mock("@/services/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
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
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: "test-path" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/test.jpg" } }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    }),
  },
  supabaseUrl: "https://test-project.supabase.co",
  supabaseAnonKey: "test-anon-key",
}));

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: "/", search: "", hash: "", state: null }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    motion: {
      div: "div",
      span: "span",
      button: "button",
      a: "a",
      img: "img",
      ul: "ul",
      li: "li",
      p: "p",
      h1: "h1",
      h2: "h2",
      h3: "h3",
      section: "section",
      article: "article",
      nav: "nav",
      header: "header",
      footer: "footer",
      main: "main",
      form: "form",
      input: "input",
      textarea: "textarea",
      select: "select",
      label: "label",
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useAnimation: () => ({
      start: vi.fn(),
      stop: vi.fn(),
      set: vi.fn(),
    }),
    useInView: () => true,
    useScroll: () => ({ scrollY: { get: () => 0 }, scrollYProgress: { get: () => 0 } }),
    useTransform: () => 0,
    useSpring: () => 0,
    useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
    useReducedMotion: () => false,
  };
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

// Global setup
beforeAll(() => {
  // Suppress console errors during tests (optional)
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

// Global cleanup
afterAll(() => {
  vi.restoreAllMocks();
});
