import { vi } from "vitest";

// ============================================================================
// Stripe Mock Types
// ============================================================================

export interface MockStripeElement {
  mount: ReturnType<typeof vi.fn>;
  unmount: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  blur: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  focus: ReturnType<typeof vi.fn>;
  collapse: ReturnType<typeof vi.fn>;
}

export interface MockStripeElements {
  create: ReturnType<typeof vi.fn>;
  getElement: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  fetchUpdates: ReturnType<typeof vi.fn>;
}

export interface MockPaymentIntent {
  id: string;
  client_secret: string;
  status: "requires_payment_method" | "requires_confirmation" | "requires_action" | "processing" | "succeeded" | "canceled";
  amount: number;
  currency: string;
}

export interface MockCheckoutSession {
  id: string;
  url: string;
  payment_status: "unpaid" | "paid";
  status: "open" | "complete" | "expired";
}

// ============================================================================
// Mock Factories
// ============================================================================

let sessionCounter = 0;
const generateSessionId = () => `cs_test_${++sessionCounter}`;

export function createMockStripeElement(): MockStripeElement {
  return {
    mount: vi.fn(),
    unmount: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    update: vi.fn(),
    blur: vi.fn(),
    clear: vi.fn(),
    focus: vi.fn(),
    collapse: vi.fn(),
  };
}

export function createMockStripeElements(): MockStripeElements {
  const element = createMockStripeElement();
  return {
    create: vi.fn().mockReturnValue(element),
    getElement: vi.fn().mockReturnValue(element),
    update: vi.fn(),
    fetchUpdates: vi.fn().mockResolvedValue({ error: null }),
  };
}

export function createMockPaymentIntent(overrides: Partial<MockPaymentIntent> = {}): MockPaymentIntent {
  return {
    id: `pi_test_${Date.now()}`,
    client_secret: `pi_test_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
    status: "requires_payment_method",
    amount: 9999,
    currency: "cny",
    ...overrides,
  };
}

export function createMockCheckoutSession(overrides: Partial<MockCheckoutSession> = {}): MockCheckoutSession {
  const id = generateSessionId();
  return {
    id,
    url: `https://checkout.stripe.com/pay/${id}`,
    payment_status: "unpaid",
    status: "open",
    ...overrides,
  };
}

// ============================================================================
// Stripe Client Mock
// ============================================================================

export interface StripeClientConfig {
  confirmPaymentResult?: { paymentIntent?: MockPaymentIntent; error?: { message: string } };
  redirectResult?: { error?: { message: string } };
  paymentIntents?: Record<string, MockPaymentIntent>;
}

export function createMockStripeClient(config: StripeClientConfig = {}) {
  const { confirmPaymentResult, redirectResult } = config;
  const elements = createMockStripeElements();

  return {
    elements: vi.fn().mockReturnValue(elements),
    confirmPayment: vi.fn().mockResolvedValue(
      confirmPaymentResult || { paymentIntent: createMockPaymentIntent({ status: "succeeded" }) }
    ),
    confirmCardPayment: vi.fn().mockResolvedValue(
      confirmPaymentResult || { paymentIntent: createMockPaymentIntent({ status: "succeeded" }) }
    ),
    confirmSetupIntent: vi.fn().mockResolvedValue({ setupIntent: { id: "seti_test" }, error: null }),
    createPaymentMethod: vi.fn().mockResolvedValue({
      paymentMethod: { id: "pm_test", type: "card" },
      error: null,
    }),
    createToken: vi.fn().mockResolvedValue({
      token: { id: "tok_test" },
      error: null,
    }),
    createSource: vi.fn().mockResolvedValue({
      source: { id: "src_test" },
      error: null,
    }),
    handleCardAction: vi.fn().mockResolvedValue({
      paymentIntent: createMockPaymentIntent({ status: "succeeded" }),
      error: null,
    }),
    handleNextAction: vi.fn().mockResolvedValue({
      paymentIntent: createMockPaymentIntent({ status: "succeeded" }),
      error: null,
    }),
    retrievePaymentIntent: vi.fn().mockResolvedValue({
      paymentIntent: createMockPaymentIntent({ status: "succeeded" }),
      error: null,
    }),
    retrieveSetupIntent: vi.fn().mockResolvedValue({
      setupIntent: { id: "seti_test", status: "succeeded" },
      error: null,
    }),
    redirectToCheckout: vi.fn().mockResolvedValue(
      redirectResult || { error: null }
    ),
    paymentRequest: vi.fn().mockReturnValue({
      canMakePayment: vi.fn().mockResolvedValue(null),
      show: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      update: vi.fn(),
    }),
    _cleanup: vi.fn(),
    registerAppInfo: vi.fn(),
  };
}

// ============================================================================
// loadStripe Mock
// ============================================================================

export function createLoadStripeMock(config: StripeClientConfig = {}) {
  const stripeClient = createMockStripeClient(config);
  return vi.fn().mockResolvedValue(stripeClient);
}

// ============================================================================
// Module Mock Helper
// ============================================================================

export function mockStripeModule(config: StripeClientConfig = {}) {
  const loadStripe = createLoadStripeMock(config);

  vi.mock("@stripe/stripe-js", () => ({
    loadStripe,
    Stripe: vi.fn(),
  }));

  return { loadStripe };
}

// ============================================================================
// Reset Helper
// ============================================================================

export function resetSessionCounter() {
  sessionCounter = 0;
}
