// Database product type (matches types/database.ts)
export interface DBProduct {
  id: number;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  category: string | null;
  stock: number | null;
  featured: boolean;
  created_at: string;
  updated_at: string | null;
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
