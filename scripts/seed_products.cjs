/**
 * Seed Products for E2E Testing
 *
 * This script adds test products to verify lazy loading and other features.
 * Run with: node scripts/seed_products.cjs
 */

const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

// Parse connection string from Supabase URL
const supabaseUrl = process.env.VITE_SUPABASE_URL;
if (!supabaseUrl) {
  console.error("Error: VITE_SUPABASE_URL not found in .env.local");
  process.exit(1);
}

const projectRef = supabaseUrl.replace("https://", "").split(".")[0];

const client = new Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  user: "postgres",
  password: process.env.SUPABASE_DB_PASSWORD || "aOn9h7xgRVtXb9fS",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

const testProducts = [
  {
    title: "Amethyst Crystal Cluster",
    description: "A stunning natural amethyst cluster for meditation and spiritual growth. Known for its calming energy and ability to enhance intuition.",
    price: 89.00,
    image_url: "https://images.unsplash.com/photo-1567225477277-c8162eb4991d?w=800",
    element: "Spirit",
    zodiac: "Pisces",
    stock_quantity: 10,
    is_active: true,
  },
  {
    title: "Rose Quartz Heart",
    description: "Hand-carved rose quartz heart symbolizing love and compassion. Perfect for attracting love and healing emotional wounds.",
    price: 45.00,
    image_url: "https://images.unsplash.com/photo-1603290513310-2b2f9d0b7f3e?w=800",
    element: "Water",
    zodiac: "Libra",
    stock_quantity: 25,
    is_active: true,
  },
  {
    title: "Clear Quartz Wand",
    description: "Powerful clear quartz wand for energy work and amplification. The master healer crystal that enhances all other stones.",
    price: 120.00,
    image_url: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800",
    element: "Air",
    zodiac: "Aries",
    stock_quantity: 8,
    is_active: true,
  },
  {
    title: "Black Tourmaline Protection Stone",
    description: "Raw black tourmaline for protection and grounding. Shields against negative energy and electromagnetic pollution.",
    price: 35.00,
    image_url: "https://images.unsplash.com/photo-1559563458-527698bf5295?w=800",
    element: "Earth",
    zodiac: "Capricorn",
    stock_quantity: 30,
    is_active: true,
  },
  {
    title: "Citrine Abundance Crystal",
    description: "Natural citrine point for attracting wealth and success. Known as the merchant's stone for prosperity.",
    price: 75.00,
    image_url: "https://images.unsplash.com/photo-1551300098-0436a9ad82ae?w=800",
    element: "Fire",
    zodiac: "Leo",
    stock_quantity: 15,
    is_active: true,
  },
  {
    title: "Selenite Charging Plate",
    description: "Large selenite plate for cleansing and charging other crystals. Brings clarity and divine connection.",
    price: 55.00,
    image_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    element: "Spirit",
    zodiac: "Cancer",
    stock_quantity: 12,
    is_active: true,
  },
];

async function seed() {
  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Check if products already exist
    const checkResult = await client.query("SELECT COUNT(*) FROM public.products");
    const existingCount = parseInt(checkResult.rows[0].count, 10);

    if (existingCount > 0) {
      console.log(`ℹ️  Found ${existingCount} existing products`);
      console.log("   Skipping seed to avoid duplicates");
      console.log("   To force reseed, run: DELETE FROM public.products WHERE title LIKE '%Crystal%' OR title LIKE '%Stone%';");
      return;
    }

    console.log("📦 Inserting test products...");

    for (const product of testProducts) {
      const query = `
        INSERT INTO public.products (title, description, price, image_url, element, zodiac, stock_quantity, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING id, title
      `;
      const values = [
        product.title,
        product.description,
        product.price,
        product.image_url,
        product.element,
        product.zodiac,
        product.stock_quantity,
        product.is_active,
      ];

      const result = await client.query(query, values);
      console.log(`   ✓ Added: ${result.rows[0].title} (ID: ${result.rows[0].id})`);
    }

    console.log(`\n✅ Seeded ${testProducts.length} test products successfully!`);
    console.log("   Run E2E tests with: npm run test:e2e");

  } catch (err) {
    console.error("❌ Error seeding products:", err.message);
    if (err.message.includes("password authentication failed")) {
      console.error("\n   Check SUPABASE_DB_PASSWORD in .env.local");
    }
    if (err.message.includes("relation \"products\" does not exist")) {
      console.error("\n   Products table not found. Run migrations first.");
    }
  } finally {
    await client.end();
  }
}

seed();
