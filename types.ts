export enum Screen {
  HOME = "HOME",
  BIRTH_CHART = "BIRTH_CHART",
  REPORT = "REPORT",
  TAROT_DAILY = "TAROT_DAILY",
  TAROT_SPREAD = "TAROT_SPREAD",
  SHOP_LIST = "SHOP_LIST",
  PRODUCT_DETAIL = "PRODUCT_DETAIL",
  EXPERTS = "EXPERTS",
  EXPERT_PROFILE = "EXPERT_PROFILE",
  BOOKING = "BOOKING",
  INTAKE = "INTAKE",
  DELIVERY = "DELIVERY",
  USER_DASHBOARD = "USER_DASHBOARD",
  ARCHIVES = "ARCHIVES",
  ORDERS = "ORDERS",
  CONSULTATIONS = "CONSULTATIONS",
  SETTINGS = "SETTINGS",
  FAVORITES = "FAVORITES",
  ADMIN_PAYMENTS = "ADMIN_PAYMENTS",
  ADMIN_CURRENCY = "ADMIN_CURRENCY",
  ADMIN_SHIPPING = "ADMIN_SHIPPING",
  ADMIN_SETTINGS = "ADMIN_SETTINGS",
}

export interface NavProps {
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
  productId?: string;
  setProductId?: (id: string) => void;
  expertId?: string;
  setExpertId?: (id: string) => void;
}
