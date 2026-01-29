import { supabase } from "./supabase";

export interface NewsletterResult {
  success: boolean;
  message: string;
  alreadySubscribed?: boolean;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const NewsletterService = {
  /**
   * Subscribe an email to the newsletter
   * @param email - The email address to subscribe
   * @param source - Where the subscription originated (footer, checkout, signup, popup)
   * @param userId - Optional user ID if the user is logged in
   */
  async subscribe(
    email: string,
    source: "footer" | "checkout" | "signup" | "popup" = "footer",
    userId?: string
  ): Promise<NewsletterResult> {
    // Validate email format
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      return {
        success: false,
        message: "Please enter an email address",
      };
    }

    if (!isValidEmail(trimmedEmail)) {
      return {
        success: false,
        message: "Please enter a valid email address",
      };
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, unsubscribed_at")
      .eq("email", trimmedEmail)
      .maybeSingle();

    if (existing) {
      // If previously unsubscribed, resubscribe
      if (existing.unsubscribed_at) {
        const { error } = await supabase
          .from("newsletter_subscribers")
          .update({
            unsubscribed_at: null,
            subscribed_at: new Date().toISOString(),
            source,
            user_id: userId || null,
          })
          .eq("id", existing.id);

        if (error) {
          console.error("[NewsletterService] Error resubscribing:", error);
          return {
            success: false,
            message: "Something went wrong. Please try again.",
          };
        }

        return {
          success: true,
          message: "Welcome back! You've been resubscribed.",
        };
      }

      // Already actively subscribed
      return {
        success: true,
        message: "You're already subscribed!",
        alreadySubscribed: true,
      };
    }

    // New subscription
    const { error } = await supabase.from("newsletter_subscribers").insert({
      email: trimmedEmail,
      source,
      user_id: userId || null,
    });

    if (error) {
      console.error("[NewsletterService] Error subscribing:", error);

      // Handle unique constraint violation (race condition)
      if (error.code === "23505") {
        return {
          success: true,
          message: "You're already subscribed!",
          alreadySubscribed: true,
        };
      }

      return {
        success: false,
        message: "Something went wrong. Please try again.",
      };
    }

    return {
      success: true,
      message: "Thanks for subscribing! Stay tuned for cosmic updates.",
    };
  },

  /**
   * Unsubscribe an email from the newsletter
   * @param email - The email address to unsubscribe
   */
  async unsubscribe(email: string): Promise<NewsletterResult> {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      return {
        success: false,
        message: "Invalid email address",
      };
    }

    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("email", trimmedEmail);

    if (error) {
      console.error("[NewsletterService] Error unsubscribing:", error);
      return {
        success: false,
        message: "Something went wrong. Please try again.",
      };
    }

    return {
      success: true,
      message: "You've been unsubscribed. We're sorry to see you go!",
    };
  },

  /**
   * Check if an email is subscribed
   * @param email - The email address to check
   */
  async isSubscribed(email: string): Promise<boolean> {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      return false;
    }

    const { data } = await supabase
      .from("newsletter_subscribers")
      .select("id")
      .eq("email", trimmedEmail)
      .is("unsubscribed_at", null)
      .maybeSingle();

    return !!data;
  },
};
