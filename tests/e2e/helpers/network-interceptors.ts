/**
 * 网络请求拦截器
 * 用于监控 API 调用和验证只读模式
 */

import { Page, Request, Route } from "@playwright/test";

/**
 * API 请求记录
 */
export interface ApiRequestRecord {
  url: string;
  method: string;
  postData?: string;
  timestamp: number;
  isWrite: boolean;
}

/**
 * API 拦截器实例
 */
export class ApiInterceptor {
  private requests: ApiRequestRecord[] = [];
  private readonly _page: Page;

  constructor(page: Page) {
    this._page = page;
  }

  /**
   * 记录请求
   */
  recordRequest(request: Request): void {
    const method = request.method().toUpperCase();
    const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    this.requests.push({
      url: request.url(),
      method,
      postData: request.postData() || undefined,
      timestamp: Date.now(),
      isWrite,
    });
  }

  /**
   * 获取所有请求
   */
  getRequests(): ApiRequestRecord[] {
    return [...this.requests];
  }

  /**
   * 获取写入请求
   */
  getWriteRequests(): ApiRequestRecord[] {
    return this.requests.filter((r) => r.isWrite);
  }

  /**
   * 获取 Supabase 请求
   */
  getSupabaseRequests(): ApiRequestRecord[] {
    return this.requests.filter((r) => r.url.includes("supabase"));
  }

  /**
   * 获取 Supabase 写入请求
   */
  getSupabaseWriteRequests(): ApiRequestRecord[] {
    return this.getSupabaseRequests().filter((r) => r.isWrite);
  }

  /**
   * 检查是否有写入操作
   */
  hasWrites(): boolean {
    return this.getWriteRequests().length > 0;
  }

  /**
   * 检查是否有 Supabase 写入操作
   */
  hasSupabaseWrites(): boolean {
    return this.getSupabaseWriteRequests().length > 0;
  }

  /**
   * 清除记录
   */
  clear(): void {
    this.requests = [];
  }

  /**
   * 获取请求统计
   */
  getStats(): {
    total: number;
    reads: number;
    writes: number;
    supabase: number;
    supabaseWrites: number;
  } {
    const writes = this.getWriteRequests().length;
    const supabase = this.getSupabaseRequests().length;
    const supabaseWrites = this.getSupabaseWriteRequests().length;

    return {
      total: this.requests.length,
      reads: this.requests.length - writes,
      writes,
      supabase,
      supabaseWrites,
    };
  }
}

/**
 * 设置 API 请求拦截器
 */
export async function setupApiInterceptors(page: Page): Promise<ApiInterceptor> {
  const interceptor = new ApiInterceptor(page);

  // 监听所有请求
  page.on("request", (request) => {
    const url = request.url();

    // 只记录 API 请求（排除静态资源）
    if (isApiRequest(url)) {
      interceptor.recordRequest(request);
    }
  });

  return interceptor;
}

/**
 * 判断是否为 API 请求
 */
function isApiRequest(url: string): boolean {
  // 排除静态资源
  const staticExtensions = [
    ".js",
    ".css",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
  ];

  for (const ext of staticExtensions) {
    if (url.includes(ext)) {
      return false;
    }
  }

  // 包含 Supabase API
  if (url.includes("supabase.co")) {
    return true;
  }

  // 包含 Stripe API
  if (url.includes("stripe.com")) {
    return true;
  }

  // 包含 API 路径
  if (url.includes("/api/") || url.includes("/rest/") || url.includes("/rpc/")) {
    return true;
  }

  return false;
}

/**
 * 捕获 Supabase 请求
 */
export async function captureSupabaseRequests(
  page: Page
): Promise<ApiRequestRecord[]> {
  const requests: ApiRequestRecord[] = [];

  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("supabase.co")) {
      const method = request.method().toUpperCase();
      requests.push({
        url,
        method,
        postData: request.postData() || undefined,
        timestamp: Date.now(),
        isWrite: ["POST", "PUT", "PATCH", "DELETE"].includes(method),
      });
    }
  });

  return requests;
}

/**
 * 判断是否为非数据变更请求（应排除在写入检测外）
 * - 认证相关：登录、token刷新
 * - Edge Functions：无状态计算，不直接修改数据库
 * - RPC 函数：通常是查询操作
 */
function isExcludedFromWriteCheck(url: string): boolean {
  return (
    // 认证相关
    url.includes("/auth/") ||
    url.includes("/token") ||
    url.includes("gotrue") ||
    url.includes("/session") ||
    // Edge Functions (无状态计算)
    url.includes("/functions/") ||
    // Realtime 订阅
    url.includes("/realtime/")
  );
}

/**
 * 验证没有写入操作（只读模式）
 * 排除认证相关请求（登录、刷新token等）
 * @throws Error 如果检测到非认证的写入操作
 */
export async function assertNoWrites(interceptor: ApiInterceptor): Promise<void> {
  const writeRequests = interceptor.getSupabaseWriteRequests();

  // 过滤掉非数据变更请求（认证、Edge Functions等）
  const actualWrites = writeRequests.filter((r) => !isExcludedFromWriteCheck(r.url));

  if (actualWrites.length > 0) {
    const details = actualWrites
      .map((r) => `${r.method} ${r.url}`)
      .join("\n  - ");

    throw new Error(
      `Read-only mode violation: ${actualWrites.length} write request(s) detected:\n  - ${details}`
    );
  }
}

/**
 * 设置请求阻断器（阻止真实写入）
 * 在严格只读模式下使用
 */
export async function setupWriteBlocker(page: Page): Promise<void> {
  await page.route("**/*supabase.co/**", async (route: Route) => {
    const request = route.request();
    const method = request.method().toUpperCase();

    // 阻止写入请求
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const url = request.url();

      // 允许认证相关请求
      if (url.includes("/auth/") || url.includes("/token")) {
        await route.continue();
        return;
      }

      // 阻止其他写入请求
      console.warn(`Blocked write request: ${method} ${url}`);
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Write operations blocked in read-only test mode",
          code: "E2E_READONLY_MODE",
        }),
      });
      return;
    }

    await route.continue();
  });
}

/**
 * 监控特定 API 端点
 */
export async function monitorEndpoint(
  page: Page,
  pattern: string | RegExp,
  callback: (request: Request) => void
): Promise<void> {
  page.on("request", (request) => {
    const url = request.url();
    const matches =
      typeof pattern === "string" ? url.includes(pattern) : pattern.test(url);

    if (matches) {
      callback(request);
    }
  });
}

/**
 * 等待特定请求完成
 */
export async function waitForRequest(
  page: Page,
  pattern: string | RegExp,
  options?: { timeout?: number }
): Promise<Request> {
  return page.waitForRequest(
    (request) => {
      const url = request.url();
      return typeof pattern === "string"
        ? url.includes(pattern)
        : pattern.test(url);
    },
    { timeout: options?.timeout || 30000 }
  );
}

/**
 * 等待特定响应
 */
export async function waitForResponse(
  page: Page,
  pattern: string | RegExp,
  options?: { timeout?: number }
): Promise<Response> {
  return page.waitForResponse(
    (response) => {
      const url = response.url();
      return typeof pattern === "string"
        ? url.includes(pattern)
        : pattern.test(url);
    },
    { timeout: options?.timeout || 30000 }
  );
}

// 导出 Response 类型
type Response = Awaited<ReturnType<Page["waitForResponse"]>>;
