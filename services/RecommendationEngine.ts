// Mock Product Catalog
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  tags: string[]; // Keywords for matching
}

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Amethyst Cluster",
    price: 45.0,
    description: "Enhances spiritual awareness and provides protection.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDP_bOhhc4Qhi372N4ioSuuVYgGCi6TW47C5lsipQPgu03yvsFASSxchHfbCkDmGCLoiu47AnTebH1rd07SeZodgMZ95G-MCC98JvDG6bfqv8P7_wdBgl69J6uoLEe9Iu5N3CfEck0yH_5z7qJDoiG0LxKpUdT04CuIXJxzOIWaMP0jX8F3MYq6uetECncxUOI3qmruDpTcuQYyacZWCct9xUq89A_N6YubdHPiEEe0Q7jElnj1O3YXVeT2tOsB3qGi2H4hvvJ-EWat",
    tags: ["spirituality", "peace", "intuition", "protection", "clarity"],
  },
  {
    id: "p2",
    name: "Rose Quartz Sphere",
    price: 38.0,
    description: "The stone of universal love. Restores trust and harmony.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCjitvq9kRFe5CuRifKd6XQXh1LXQRr1fXoy_IKJveYKScvcD9_AniPcIvWpjno-w6JeQCpEryUuQpR_37v-bRA1hbg3YaUEz0PhOnw4zRrDMFcJzdeTDsvHWQWHRP1youUaRsJySNHBdlTYNUId5J99pskk7aoezdWY927fJ8zuJX_UPwjONUocANU29YLZGcr8QLx6fTJN8t66UTLNjMc7tcokl_WVh0Zi5CNS9w7ENRBTxJnefOf7_b7TXJL4PP3JhuOn1VaZApA", // Using Tarot image as placeholder for now
    tags: ["love", "relationships", "healing", "heart", "emotion"],
  },
  {
    id: "p3",
    name: "Black Tourmaline",
    price: 25.0,
    description: "Powerful grounding stone that swallows negative energy.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBk3poV6quSXOoNErUgmqhtfis7nYaRN_n2urnfm51EGatpRyUph1c9O-semyeWwN_zV3RSmfoWPee_WhODcfQPMXJ6_wunKWjRteFm8kd-5pzmrtB9dhjHDzoTguzysDjEYcf6_SqRqF7UG7QgEn8ZeU06HRRMccexpzMqJgwUlIQ5DMK0TkYEwU6jrp79M9dL6EQ_xFc-WiUI0X8LKnZzO8C7ai-GInzk8TUhr4uZQHZFR1T0f-swvVLHZn6OUJ0kPGBTW9vVuvqg",
    tags: ["grounding", "protection", "stress", "anxiety", "shield"],
  },
  {
    id: "p4",
    name: "Golden Tarot Deck",
    price: 32.0,
    description: "A limited edition deck for deep divination.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCjitvq9kRFe5CuRifKd6XQXh1LXQRr1fXoy_IKJveYKScvcD9_AniPcIvWpjno-w6JeQCpEryUuQpR_37v-bRA1hbg3YaUEz0PhOnw4zRrDMFcJzdeTDsvHWQWHRP1youUaRsJySNHBdlTYNUId5J99pskk7aoezdWY927fJ8zuJX_UPwjONUocANU29YLZGcr8QLx6fTJN8t66UTLNjMc7tcokl_WVh0Zi5CNS9w7ENRBTxJnefOf7_b7TXJL4PP3JhuOn1VaZApA",
    tags: ["divination", "insight", "future", "mystery", "learning"],
  },
  {
    id: "p5",
    name: "Citrine Point",
    price: 55.0,
    description: "Attracts wealth, prosperity and success.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAzd5B9TSFjJHvoO2Ugw-WTMlOpKYfopG8DNLyqr7Q4EG7ETvB4U2G4mTB12Ym8Ez3UzokdE8NrM1GRyRl7KCLTkoGPDyGUps5fFY13m-73YX2yAlgFUegofFABEZ5UAuLdh-kigNKDvfT0ZUqQ2_RFH6l4M_daBpt2v3QAV47hTroa8GKmzJ4TrFcgzYqVxBVUUWTKQFTruqdmSXHWT_Ii5o0rL6fBAm0Y8DZqc25PqoyipKx66LdfOCaPK0W5G4pl_2e_yqQmWzUY",
    tags: ["wealth", "success", "confidence", "energy", "career"],
  },
];

export const RecommendationEngine = {
  // Basic keyword matching
  getRecommendations(text: string, limit: number = 2): Product[] {
    const lowerText = text.toLowerCase();

    // Score products based on tag matches in the text
    const scoredProducts = PRODUCTS.map((product) => {
      let score = 0;
      product.tags.forEach((tag) => {
        const regex = new RegExp(`\\b${tag}\\b`, "g");
        const matches = lowerText.match(regex);
        if (matches) {
          score += matches.length;
        }
      });
      return { product, score };
    });

    // Filter out zero scores and sort by score desc
    const sorted = scoredProducts
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.product);

    // If no matches, return random (or "Staff Pick")
    if (sorted.length === 0) {
      return PRODUCTS.slice(0, limit);
    }

    return sorted.slice(0, limit);
  },
};
