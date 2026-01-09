/**
 * 测试数据管理工具
 * 用于生成唯一标识符和测试数据
 */

/**
 * 生成带时间戳的唯一测试 ID
 */
export function generateTestId(prefix: string = "e2e"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 生成测试用户邮箱
 */
export function getTestUserEmail(prefix: string = "test"): string {
  return `${prefix}_${Date.now()}@test.silksparks.com`;
}

/**
 * Stripe 测试卡号常量
 * @see https://docs.stripe.com/testing#cards
 */
export const STRIPE_TEST_CARDS = {
  /** 成功支付 */
  SUCCESS: "4242424242424242",
  /** Visa 成功 */
  VISA_SUCCESS: "4000000000000077",
  /** 拒绝 - 通用拒绝 */
  DECLINE_GENERIC: "4000000000000002",
  /** 拒绝 - 余额不足 */
  DECLINE_INSUFFICIENT_FUNDS: "4000000000009995",
  /** 拒绝 - 丢失卡片 */
  DECLINE_LOST_CARD: "4000000000009987",
  /** 拒绝 - 盗刷卡片 */
  DECLINE_STOLEN_CARD: "4000000000009979",
  /** 需要 3DS 认证 */
  REQUIRES_3DS: "4000002500003155",
  /** 卡片过期 */
  EXPIRED: "4000000000000069",
  /** CVC 错误 */
  INCORRECT_CVC: "4000000000000127",
  /** 处理中 - 最终成功 */
  PROCESSING_SUCCESS: "4000000000000259",
} as const;

/**
 * 测试卡片有效期（未来日期）
 */
export const STRIPE_TEST_EXPIRY = {
  VALID: "12/30",
  EXPIRED: "01/20",
} as const;

/**
 * 测试 CVC
 */
export const STRIPE_TEST_CVC = "123";

/**
 * 测试 ZIP/邮编
 */
export const STRIPE_TEST_ZIP = "12345";

/**
 * 测试用户数据
 */
export interface TestUserData {
  email: string;
  password: string;
  name?: string;
}

/**
 * 生成测试用户数据
 */
export function generateTestUser(options?: {
  prefix?: string;
  password?: string;
}): TestUserData {
  return {
    email: getTestUserEmail(options?.prefix || "user"),
    password: options?.password || "TestPassword123!",
    name: `Test User ${Date.now()}`,
  };
}

/**
 * 测试出生数据
 */
export const TEST_BIRTH_DATA = {
  date: "1990-01-15",
  time: "14:30",
  location: "Shanghai, China",
  lat: 31.2304,
  lng: 121.4737,
} as const;

/**
 * 测试产品 ID（用于只读测试）
 * 这些应该是生产环境中存在的产品
 */
export const TEST_PRODUCT_IDS = {
  // 这些 ID 需要根据实际数据库调整
  FIRST_PRODUCT: "1",
  FEATURED_PRODUCT: "featured-1",
} as const;

/**
 * 测试专家 ID（用于只读测试）
 */
export const TEST_EXPERT_IDS = {
  FIRST_EXPERT: "1",
} as const;

/**
 * 等待指定毫秒
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 测试运行 ID（用于追踪）
 */
export const TEST_RUN_ID = `e2e_run_${Date.now()}`;
