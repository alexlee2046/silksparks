// Consultation component prop types

export interface ExpertCardProps {
  name: string;
  title: string;
  rating: number | null;
  reviews: number;
  price: string;
  tags: string[] | null;
  image: string | null;
  isOnline?: boolean;
  onBook: () => void;
  onProfile: () => void;
  index: number;
}

export interface DeliveryOptionProps {
  title: string;
  icon: string;
  desc: string;
  action: string;
  onClick: () => void;
  delay: number;
}
