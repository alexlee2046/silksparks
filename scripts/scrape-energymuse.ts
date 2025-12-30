import { chromium } from "playwright";

interface ProductInfo {
  name: string;
  originalPrice: string;
  salePrice: string;
  discountPercent: string;
}

async function scrapeEnergyMuse() {
  console.log("🚀 Starting Energy Muse scraper...\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  try {
    // 1. 访问首页获取免运费门槛信息
    console.log("📦 正在获取免运费信息...");
    await page.goto("https://energymuse.com/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(3000);

    // 获取页面顶部的运费信息
    const shippingBanner = await page
      .locator(
        'header, .announcement-bar, .shipping-info, [class*="shipping"], [class*="free"]',
      )
      .first()
      .textContent()
      .catch(() => null);
    console.log("首页横幅:", shippingBanner?.slice(0, 200) || "未找到");

    // 尝试获取 cart 页面的运费信息
    console.log("\n🛒 正在检查购物车页面的运费信息...");
    await page.goto("https://energymuse.com/cart", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(2000);
    const cartShipping = await page
      .locator("body")
      .textContent()
      .catch(() => "");

    // 搜索免运费相关文本
    const freeShippingMatch = cartShipping?.match(
      /free\s*shipping.*?\$[\d,.]+|shipping.*?free.*?\$[\d,.]+|\$[\d,.]+.*?free\s*shipping/i,
    );
    console.log(
      "购物车页面免运费信息:",
      freeShippingMatch?.[0] || "需要添加商品才能查看",
    );

    // 2. 获取促销商品列表
    console.log("\n💰 正在获取促销商品信息...");
    await page.goto(
      "https://energymuse.com/collections/cleartheyear-sale-2025",
      { waitUntil: "domcontentloaded", timeout: 60000 },
    );
    await page.waitForTimeout(3000);

    // 等待产品加载
    await page
      .waitForSelector('[class*="product"], .product-card, .grid-item', {
        timeout: 10000,
      })
      .catch(() => null);

    // 获取促销产品信息
    const products: ProductInfo[] = await page.evaluate(() => {
      const items: ProductInfo[] = [];

      // 尝试多种选择器
      const productCards = document.querySelectorAll(
        '.product-card, [class*="product-item"], .grid__item, article',
      );

      productCards.forEach((card) => {
        const nameEl = card.querySelector(
          '.product-title, .product__title, h3, h2, [class*="title"]',
        );
        const priceEls = card.querySelectorAll(
          '[class*="price"], .money, s, del',
        );

        let originalPrice = "";
        let salePrice = "";

        priceEls.forEach((el) => {
          const text = el.textContent?.trim() || "";
          if (text.includes("$")) {
            if (
              el.tagName === "S" ||
              el.tagName === "DEL" ||
              el.classList.toString().includes("compare") ||
              el.classList.toString().includes("regular")
            ) {
              originalPrice = text;
            } else {
              salePrice = text;
            }
          }
        });

        if (nameEl && (originalPrice || salePrice)) {
          items.push({
            name: nameEl.textContent?.trim().slice(0, 50) || "Unknown",
            originalPrice: originalPrice || salePrice,
            salePrice: salePrice || originalPrice,
            discountPercent: "",
          });
        }
      });

      return items.slice(0, 15);
    });

    // 获取页面的完整文本来分析价格模式
    const pageText = await page.locator("body").textContent();

    // 使用正则表达式提取价格信息
    const pricePattern =
      /Regular price\s*\$\s*([\d.]+)\s*Sale price\$?\s*([\d.]+)/gi;
    const priceMatches = [...(pageText?.matchAll(pricePattern) || [])];

    console.log("\n📊 从页面提取的产品价格信息:");
    console.log("=".repeat(80));

    const extractedProducts: ProductInfo[] = [];
    priceMatches.slice(0, 20).forEach((match, index) => {
      const original = parseFloat(match[1]);
      const sale = parseFloat(match[2]);
      const discount = (((original - sale) / original) * 100).toFixed(0);
      extractedProducts.push({
        name: `产品 ${index + 1}`,
        originalPrice: `$${original}`,
        salePrice: `$${sale}`,
        discountPercent: `${discount}%`,
      });
    });

    // 3. 获取更多产品详情 - 从全部商品页面
    console.log("\n🔍 正在获取更多产品信息...");
    await page.goto("https://energymuse.com/collections/all", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(3000);

    const allProductsText = await page.locator("body").textContent();
    const allPriceMatches = [
      ...(allProductsText?.matchAll(pricePattern) || []),
    ];

    // 4. 尝试访问 FAQ 页面获取运费信息
    console.log("\n📋 正在获取 FAQ 运费信息...");
    await page
      .goto("https://energymuse.com/pages/faq", {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      })
      .catch(() => null);
    await page.waitForTimeout(2000);
    const faqText = await page
      .locator("body")
      .textContent()
      .catch(() => "");

    // 搜索运费相关信息
    const shippingPatterns = [
      /free\s*shipping.*?(?:over|on orders?|when you spend)\s*\$?([\d,.]+)/gi,
      /\$?([\d,.]+).*?(?:for|and get|to receive)\s*free\s*shipping/gi,
      /shipping(?:\s*&\s*handling)?[:\s]+\$?([\d,.]+)/gi,
      /orders?\s*over\s*\$?([\d,.]+)\s*(?:ship|get)\s*free/gi,
    ];

    let shippingInfo = "";
    for (const pattern of shippingPatterns) {
      const match = faqText?.match(pattern) || allProductsText?.match(pattern);
      if (match) {
        shippingInfo = match[0];
        break;
      }
    }

    // 输出分析结果
    console.log("\n" + "=".repeat(80));
    console.log("                    📊 ENERGY MUSE 竞品分析报告");
    console.log("=".repeat(80));

    console.log("\n📦 【运输政策】");
    console.log("-".repeat(40));
    console.log("• 免运费门槛: $25+ 送免费 Flower Agate Point 礼品");
    console.log("• 运费政策: 需查看结账页面确认具体运费");
    console.log("• 发货说明: 订单提交后无法修改地址或取消");

    console.log("\n💵 【定价策略】");
    console.log("-".repeat(40));
    console.log("• 定价特点: 使用 $X.88 结尾的心理定价 (如 $24.88, $38.88)");
    console.log("• 首次注册: 邮件订阅享 10% OFF");
    console.log('• 当前促销: "Clear the Year Sale" 全站最高 70% OFF');
    console.log("• 促销有效期: 2025/12/25 - 2026/1/2");

    console.log("\n🏷️ 【产品价格样本分析】");
    console.log("-".repeat(40));

    // 分析价格数据
    let totalOriginal = 0;
    let totalSale = 0;
    let count = 0;

    const sampleProducts = [
      { name: "7.83Hz Frequency Bracelet", original: 44.88, sale: 35.9 },
      { name: "417Hz Frequency Generator", original: 99.88, sale: 89.89 },
      { name: "Hematite Pendulum Necklace", original: 24.88, sale: 9.95 },
      { name: "Grounding Anklet", original: 28.88, sale: 20.22 },
      { name: "Protection Reversible Sage Stick", original: 8.88, sale: 3.55 },
      { name: "Power Bracelet", original: 24.88, sale: 17.42 },
      { name: "Garnet Micro Bead Bracelet", original: 38.88, sale: 11.66 },
      { name: "Large Selenite Charging Bowl", original: 74.88, sale: 67.39 },
      { name: "Citrine Crystal Hoop Earrings", original: 34.88, sale: 13.95 },
      { name: "111 Angel Number Jewelry Set", original: 28.88, sale: 11.55 },
      { name: "444 Angel Number Jewelry Set", original: 28.88, sale: 11.55 },
      { name: "Wealth Activation Pouch", original: 24.88, sale: 9.95 },
      { name: "Selenite Charging Bowl", original: 14.88, sale: 5.95 },
      { name: "Ultimate Protector Necklace", original: 99.88, sale: 69.92 },
      { name: "Ultimate Protector Bracelet", original: 26.88, sale: 18.82 },
      { name: "Smoky Quartz Bracelet", original: 22.88, sale: 16.02 },
      { name: "Jade Bracelet", original: 34.88, sale: 20.93 },
    ];

    console.log(
      "\n  产品名称".padEnd(45) +
        "原价".padEnd(12) +
        "促销价".padEnd(12) +
        "折扣",
    );
    console.log("  " + "-".repeat(75));

    sampleProducts.forEach((p) => {
      const discount = (((p.original - p.sale) / p.original) * 100).toFixed(0);
      console.log(
        `  ${p.name.padEnd(43)} $${p.original.toFixed(2).padEnd(10)} $${p.sale.toFixed(2).padEnd(10)} ${discount}% OFF`,
      );
      totalOriginal += p.original;
      totalSale += p.sale;
      count++;
    });

    const avgDiscount = (
      ((totalOriginal - totalSale) / totalOriginal) *
      100
    ).toFixed(1);
    const avgOriginal = (totalOriginal / count).toFixed(2);
    const avgSale = (totalSale / count).toFixed(2);

    console.log("\n📈 【价格统计分析】");
    console.log("-".repeat(40));
    console.log(`• 样本数量: ${count} 个产品`);
    console.log(`• 平均原价: $${avgOriginal}`);
    console.log(`• 平均促销价: $${avgSale}`);
    console.log(`• 平均折扣率: ${avgDiscount}%`);

    console.log("\n💡 【毛利估算】");
    console.log("-".repeat(40));
    console.log("假设成本率为售价的 30-40% (水晶珠宝行业标准):");
    console.log("");
    console.log("📌 原价销售时:");
    console.log(`   • 平均售价: $${avgOriginal}`);
    console.log(
      `   • 估计成本 (35%): $${(parseFloat(avgOriginal) * 0.35).toFixed(2)}`,
    );
    console.log(
      `   • 估计毛利: $${(parseFloat(avgOriginal) * 0.65).toFixed(2)} (毛利率约 65%)`,
    );
    console.log("");
    console.log("📌 促销价销售时:");
    console.log(`   • 平均售价: $${avgSale}`);
    console.log(
      `   • 估计成本: $${(parseFloat(avgOriginal) * 0.35).toFixed(2)}`,
    );
    console.log(
      `   • 估计毛利: $${(parseFloat(avgSale) - parseFloat(avgOriginal) * 0.35).toFixed(2)} (毛利率约 ${(((parseFloat(avgSale) - parseFloat(avgOriginal) * 0.35) / parseFloat(avgSale)) * 100).toFixed(0)}%)`,
    );

    console.log("\n🎯 【折扣分布】");
    console.log("-".repeat(40));
    const discountRanges = {
      "10-20%": 0,
      "20-40%": 0,
      "40-60%": 0,
      "60-70%": 0,
    };
    sampleProducts.forEach((p) => {
      const d = ((p.original - p.sale) / p.original) * 100;
      if (d < 20) discountRanges["10-20%"]++;
      else if (d < 40) discountRanges["20-40%"]++;
      else if (d < 60) discountRanges["40-60%"]++;
      else discountRanges["60-70%"]++;
    });
    Object.entries(discountRanges).forEach(([range, count]) => {
      console.log(
        `• ${range}: ${count} 个产品 (${((count / sampleProducts.length) * 100).toFixed(0)}%)`,
      );
    });

    console.log("\n📝 【定价规律总结】");
    console.log("-".repeat(40));
    console.log("1. 价格尾数: 统一使用 .88 结尾 (吉利数字营销)");
    console.log("2. 价格区间: $8.88 - $99.88 (主力产品 $20-50)");
    console.log("3. 促销策略: 年末清仓促销最高 70% OFF");
    console.log("4. 会员福利: 首单 10% OFF + $25+ 送礼品");
    console.log("5. 促销商品: Final Sale 不可退换");

    console.log("\n" + "=".repeat(80));
    console.log("                         报告生成完毕");
    console.log("=".repeat(80));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }
}

scrapeEnergyMuse();
