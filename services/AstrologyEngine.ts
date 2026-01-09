import * as Astronomy from "astronomy-engine";
import { getZodiacFromLongitude, type ZodiacSign } from "../lib/ZodiacUtils";

export interface BirthData {
  date: Date;
  latitude: number;
  longitude: number;
}

export interface PlanetaryPositions {
  Sun: ZodiacSign;
  Moon: ZodiacSign;
  Mercury: ZodiacSign;
  Venus: ZodiacSign;
  Mars: ZodiacSign;
  Jupiter: ZodiacSign;
  Saturn: ZodiacSign;
}

export interface FiveElementsDistribution {
  Wood: number;
  Fire: number;
  Earth: number;
  Metal: number;
  Water: number;
}

export const AstrologyEngine = {
  /**
   * Calculates the Zodiac sign for a given celestial body's longitude.
   * @deprecated Use getZodiacFromLongitude from lib/ZodiacUtils instead
   */
  getZodiacSign(longitude: number): ZodiacSign {
    return getZodiacFromLongitude(longitude);
  },

  /**
   * Calculates current planetary positions based on birth data or current time.
   */
  calculatePlanetaryPositions(
    date: Date,
    _lat: number,
    _lng: number,
  ): PlanetaryPositions {
    const time = Astronomy.MakeTime(date);

    const getBodySign = (body: string) => {
      // Get geocentric vector
      const vector = Astronomy.GeoVector(body as Astronomy.Body, time, true);
      // Convert to ecliptic coordinates to get longitude

      const ecliptic = Astronomy.Ecliptic(vector);
      return this.getZodiacSign(ecliptic.elon);
    };

    return {
      Sun: getBodySign("Sun"),
      Moon: getBodySign("Moon"),
      Mercury: getBodySign("Mercury"),
      Venus: getBodySign("Venus"),
      Mars: getBodySign("Mars"),
      Jupiter: getBodySign("Jupiter"),
      Saturn: getBodySign("Saturn"),
    };
  },

  // Simplified Five Elements logic (Wu Xing) based on Solar Season approximations
  // In true BaZi this is much more complex, but this serves as a good MVP approximation
  calculateFiveElements(date: Date): FiveElementsDistribution {
    const month = date.getMonth() + 1; // 1-12
    const hour = date.getHours(); // 0-23

    // Base distribution
    const dist = { Wood: 20, Fire: 20, Earth: 20, Metal: 20, Water: 20 };

    // Modify based on Season (Month)
    // Spring (Feb-Apr): Wood strong
    if (month >= 2 && month <= 4) {
      dist.Wood += 30;
      dist.Earth -= 10;
    }
    // Summer (May-Jul): Fire strong
    else if (month >= 5 && month <= 7) {
      dist.Fire += 30;
      dist.Metal -= 10;
    }
    // Autumn (Aug-Oct): Metal strong
    else if (month >= 8 && month <= 10) {
      dist.Metal += 30;
      dist.Wood -= 10;
    }
    // Winter (Nov-Jan): Water strong
    else {
      dist.Water += 30;
      dist.Fire -= 10;
    }

    // Modify based on Time of Day (Hourly Branch approximation)
    // Morning (3-7): Wood
    if (hour >= 3 && hour < 7) dist.Wood += 10;
    // Day (9-13): Fire
    else if (hour >= 9 && hour < 13) dist.Fire += 10;
    // Afternoon (15-19): Metal
    else if (hour >= 15 && hour < 19) dist.Metal += 10;
    // Night (21-1): Water
    else if (hour >= 21 || hour < 1) dist.Water += 10;
    // Earth hours (transitions): 1-3, 7-9, 13-15, 19-21
    else dist.Earth += 10;

    // Normalize to percentage
    const total = dist.Wood + dist.Fire + dist.Earth + dist.Metal + dist.Water;
    return {
      Wood: Math.round((dist.Wood / total) * 100),
      Fire: Math.round((dist.Fire / total) * 100),
      Earth: Math.round((dist.Earth / total) * 100),
      Metal: Math.round((dist.Metal / total) * 100),
      Water: Math.round((dist.Water / total) * 100),
    };
  },
};
