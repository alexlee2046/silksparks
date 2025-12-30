import { supabase } from "./supabase";

export interface Product {
  id: string;
  name: string; // Mapped from title
  title?: string;
  price: number;
  description: string;
  image: string; // Mapped from image_url
  image_url?: string;
  tags?: string[];
  score?: number;
}

export const RecommendationEngine = {
  async getRecommendations(
    text: string,
    limit: number = 3,
  ): Promise<Product[]> {
    const lowerText = text.toLowerCase();

    // Fetch all products with their tags
    // Supabase join syntax: products(*, product_tags(tags(name)))
    const { data: productsData, error } = await supabase.from("products")
      .select(`
        *,
        product_tags (
          tags (
            name
          )
        )
      `);

    if (error || !productsData) {
      console.error("Error fetching products for recs:", error);
      return [];
    }

    // Process and Score
    const scoredProducts = productsData.map((p: any) => {
      let score = 0;
      const tags =
        p.product_tags?.map((pt: any) => pt.tags?.name.toLowerCase()) || [];

      // Keyword matching in tags
      tags.forEach((tag: string) => {
        if (lowerText.includes(tag)) score += 5;
      });

      // Keyword matching in title/description
      if (p.title.toLowerCase().includes(lowerText)) score += 3;
      if (p.description?.toLowerCase().includes(lowerText)) score += 1;

      // Map to frontend interface
      return {
        id: p.id,
        name: p.title,
        price: p.price,
        description: p.description,
        image: p.image_url,
        tags: tags,
        score,
      };
    });

    // Sort and limit
    const sorted = scoredProducts
      .filter((p: any) => p.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, limit);

    // Fallback logic: Ensure we always return 'limit' items if possible
    let finalRecs = [...sorted];

    if (finalRecs.length < limit) {
      // Find items not already in the list
      const existingIds = new Set(finalRecs.map((p) => p.id));
      const remaining = scoredProducts.filter(
        (p: any) => !existingIds.has(p.id),
      );

      // Shuffle remaining items to keep it dynamic
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }

      finalRecs = [
        ...finalRecs,
        ...remaining.slice(0, limit - finalRecs.length),
      ];
    }

    return finalRecs;
  },

  // Personalized recommendations based on User Profile
  async getPersonalizedRecs(
    userProfile: any,
    limit: number = 3,
  ): Promise<Product[]> {
    let searchTerm = "protection"; // Default fallback

    // Try to derive search term from Astrlogical Element if available
    if (userProfile?.birthData?.date) {
      const date = new Date(userProfile.birthData.date);
      const month = date.getMonth() + 1;
      const day = date.getDate();

      // Simple Zodiac Element Mapping
      // Fire: Aries, Leo, Sagittarius
      // Earth: Taurus, Virgo, Capricorn
      // Air: Gemini, Libra, Aquarius
      // Water: Cancer, Scorpio, Pisces

      // Very rough check (could use shared AstrologyEngine but keeping it simple/decoupled)
      if ((month === 3 && day >= 21) || (month === 4 && day <= 19))
        searchTerm = "fire"; // Aries
      else if ((month === 4 && day >= 20) || (month === 5 && day <= 20))
        searchTerm = "earth"; // Taurus
      else if ((month === 5 && day >= 21) || (month === 6 && day <= 20))
        searchTerm = "air"; // Gemini
      else if ((month === 6 && day >= 21) || (month === 7 && day <= 22))
        searchTerm = "water"; // Cancer
      else if ((month === 7 && day >= 23) || (month === 8 && day <= 22))
        searchTerm = "fire"; // Leo
      else if ((month === 8 && day >= 23) || (month === 9 && day <= 22))
        searchTerm = "earth"; // Virgo
      else if ((month === 9 && day >= 23) || (month === 10 && day <= 22))
        searchTerm = "air"; // Libra
      else if ((month === 10 && day >= 23) || (month === 11 && day <= 21))
        searchTerm = "water"; // Scorpio
      else if ((month === 11 && day >= 22) || (month === 12 && day <= 21))
        searchTerm = "fire"; // Sagittarius
      else if ((month === 12 && day >= 22) || (month === 1 && day <= 19))
        searchTerm = "earth"; // Capricorn
      else if ((month === 1 && day >= 20) || (month === 2 && day <= 18))
        searchTerm = "air"; // Aquarius
      else if ((month === 2 && day >= 19) || (month === 3 && day <= 20))
        searchTerm = "water"; // Pisces
    }

    return this.getRecommendations(searchTerm, limit);
  },

  // Get featured products for homepage
  async getFeaturedProducts(limit: number = 4): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_featured", true)
      .limit(limit);

    if (error || !data) {
      // Fallback: return random products
      const { data: fallbackData } = await supabase
        .from("products")
        .select("*")
        .limit(limit);

      return (fallbackData || []).map((p: any) => ({
        id: p.id,
        name: p.title,
        title: p.title,
        price: p.price,
        description: p.description,
        image: p.image_url,
        image_url: p.image_url,
      }));
    }

    return data.map((p: any) => ({
      id: p.id,
      name: p.title,
      title: p.title,
      price: p.price,
      description: p.description,
      image: p.image_url,
      image_url: p.image_url,
    }));
  },
};
