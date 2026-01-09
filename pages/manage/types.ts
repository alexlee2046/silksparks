// Component prop types
export interface AdminNavLinkProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

export interface StatsMiniProps {
  label: string;
  value: string;
  change: string;
}

export interface ProviderCardProps {
  name: string;
  icon: string;
  connected?: boolean;
}

export interface CurrencyRowProps {
  name: string;
  code: string;
  rate: string;
  defaultC?: boolean;
}

export interface ShippingZoneProps {
  name: string;
  rates: Array<{ name: string; price: string }>;
}

export interface AIConfig {
  systemPrompt: string;
  temperature: number;
  openrouter_key: string;
  gemini_key: string;
  model: string;
}
