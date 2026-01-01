/**
 * Device Performance Detection Hook
 * Detects device capabilities to recommend quality settings
 */

import { useMemo } from "react";

export type PerformanceTier = "high" | "medium" | "low";

interface DevicePerformance {
  tier: PerformanceTier;
  isMobile: boolean;
  hasReducedMotion: boolean;
  gpuTier: "high" | "medium" | "low" | "unknown";
  memory: number | null; // GB
  cores: number | null;
}

/**
 * Detect device performance capabilities
 */
export function useDevicePerformance(): DevicePerformance {
  return useMemo(() => {
    // Default for SSR
    if (typeof window === "undefined") {
      return {
        tier: "medium",
        isMobile: false,
        hasReducedMotion: false,
        gpuTier: "unknown",
        memory: null,
        cores: null,
      };
    }

    // Check for reduced motion preference
    const hasReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768;

    // Get hardware info (if available)
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      hardwareConcurrency?: number;
    };
    const memory = nav.deviceMemory ?? null;
    const cores = nav.hardwareConcurrency ?? null;

    // Try to detect GPU tier via WebGL
    let gpuTier: "high" | "medium" | "low" | "unknown" = "unknown";
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          const rendererLower = renderer.toLowerCase();

          // High-end GPUs
          if (
            rendererLower.includes("nvidia") ||
            rendererLower.includes("radeon rx") ||
            rendererLower.includes("geforce") ||
            rendererLower.includes("apple m1") ||
            rendererLower.includes("apple m2") ||
            rendererLower.includes("apple m3") ||
            rendererLower.includes("apple m4")
          ) {
            gpuTier = "high";
          }
          // Integrated/Mid GPUs
          else if (
            rendererLower.includes("intel") ||
            rendererLower.includes("adreno") ||
            rendererLower.includes("mali")
          ) {
            gpuTier = "medium";
          }
          // Low-end or software rendering
          else if (
            rendererLower.includes("swiftshader") ||
            rendererLower.includes("software") ||
            rendererLower.includes("llvmpipe")
          ) {
            gpuTier = "low";
          }
        }
      }
    } catch {
      // WebGL detection failed
    }

    // Calculate overall performance tier
    let tier: PerformanceTier = "medium";

    // Force low for reduced motion preference
    if (hasReducedMotion) {
      tier = "low";
    }
    // Mobile devices default to medium (can handle basic 3D)
    else if (isMobile) {
      tier = gpuTier === "high" ? "medium" : "low";
    }
    // Desktop with good specs
    else if (
      gpuTier === "high" ||
      (cores && cores >= 8 && memory && memory >= 8)
    ) {
      tier = "high";
    }
    // Desktop with decent specs
    else if (
      gpuTier === "medium" ||
      (cores && cores >= 4 && memory && memory >= 4)
    ) {
      tier = "medium";
    }
    // Low-end desktop or unknown
    else if (gpuTier === "low" || (memory && memory < 4)) {
      tier = "low";
    }

    return {
      tier,
      isMobile,
      hasReducedMotion,
      gpuTier,
      memory,
      cores,
    };
  }, []);
}
