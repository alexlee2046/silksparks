// Database product type (matches supabase_init.sql schema)
export interface DBProduct {
  id: number;
  title: string;
  price: number;
  description: string | null;
  image_url: string | null;
  element: string | null;
  badge: string | null;
  category: string | null;
  vibe: string | null;
  ritual: string | null;
  wisdom: string | null;
  rating: number;
  review_count: number;
  created_at: string;
}

// Component prop types
export interface FilterSectionProps {
  title: string;
  icon: string;
  items?: string[];
  selectedItems?: string[];
  onToggle?: (item: string) => void;
}

export interface ShopItemProps {
  title: string;
  price: string;
  element?: string | null;
  image?: string | null;
  badge?: string | null;
  onClick: () => void;
  onQuickAdd: (e: React.MouseEvent) => void;
  index: number;
}
