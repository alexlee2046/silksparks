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

    // Fallback if no matches: return highly rated or random
    if (sorted.length === 0) {
      // Just return top 3 products by rating/default
      return scoredProducts.slice(0, limit);
    }

    return sorted;
  },

  // Personalized recommendations based on User Profile (e.g. birth chart element)
  async getPersonalizedRecs(
    userProfile: any,
    limit: number = 3,
  ): Promise<Product[]> {
    // Logic: Map zodiac sign/element to tags
    // This is a placeholder for Phase 5 logic
    // For now, return generic recommendations
    return this.getRecommendations("spirituality", limit);
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
