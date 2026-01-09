// Dashboard component prop types

export interface NavBtnProps {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export interface ArchiveCardProps {
  item: {
    id?: string | number;
    type: string;
    title: string;
    date: string;
    summary: string;
    image?: string;
  };
}

export interface DashboardCardProps {
  title: string;
  icon: string;
  value: number | string;
  label: string;
  color: string;
  onClick?: () => void;
}
