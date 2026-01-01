// Shared utilities for tarot card components

export const getRomanNumeral = (n: number): string => {
  const roman: { [key: number]: string } = {
    0: "0",
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
    7: "VII",
    8: "VIII",
    9: "IX",
    10: "X",
    11: "XI",
    12: "XII",
    13: "XIII",
    14: "XIV",
    15: "XV",
    16: "XVI",
    17: "XVII",
    18: "XVIII",
    19: "XIX",
    20: "XX",
    21: "XXI",
  };
  return roman[n] || n.toString();
};

export interface TarotCardData {
  id: string;
  name: string;
  arcana: string;
}

export const getCardNumberDisplay = (card: TarotCardData): string => {
  if (card.arcana === "Major") {
    // Extract number from ID (id is like 'm01' or 'm12')
    const num = parseInt(card.id.replace("m", ""), 10);
    return getRomanNumeral(num);
  }
  // Minor Arcana
  if (card.name.startsWith("Ace")) return "I";
  if (card.name.startsWith("Two")) return "II";
  if (card.name.startsWith("Three")) return "III";
  if (card.name.startsWith("Four")) return "IV";
  if (card.name.startsWith("Five")) return "V";
  if (card.name.startsWith("Six")) return "VI";
  if (card.name.startsWith("Seven")) return "VII";
  if (card.name.startsWith("Eight")) return "VIII";
  if (card.name.startsWith("Nine")) return "IX";
  if (card.name.startsWith("Ten")) return "X";

  return "";
};

// Updated Filter to better match the sharp gold-on-black aesthetic
export const GOLD_FOIL_FILTER =
  "grayscale(100%) contrast(200%) brightness(0.7) invert(100%) sepia(100%) saturate(400%) hue-rotate(5deg)";
