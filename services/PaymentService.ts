/**
 * Mock Payment Service
 * Simulates payment processing with timeouts and validation.
 */

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export const PaymentService = {
  /**
   * Process a payment.
   * @param amount Total amount to charge
   * @param currency Currency code (default USD)
   * @param paymentMethodId Mock payment method ID
   */
  async processPayment(
    amount: number,
    currency: string = "USD",
    paymentMethodId?: string,
  ): Promise<PaymentResult> {
    console.log(
      `[PaymentService] Processing payment of ${amount} ${currency}...`,
    );

    // Simulate network delay (1-3 seconds)
    const delay = Math.floor(Math.random() * 2000) + 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Simulate random failure (5% chance)
    if (Math.random() < 0.05) {
      console.warn("[PaymentService] Payment declined by bank.");
      return {
        success: false,
        error: "Card declined. Please try another payment method.",
      };
    }

    // Simulate validation
    if (amount <= 0) {
      return {
        success: false,
        error: "Invalid amount.",
      };
    }

    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log(
      `[PaymentService] Payment successful. Transaction ID: ${transactionId}`,
    );

    return {
      success: true,
      transactionId,
    };
  },

  /**
   * Validate inventory availability (Mock)
   * In a real app, this would check against the database transactionally.
   */
  async checkInventory(
    items: any[],
  ): Promise<{ available: boolean; failedItems: string[] }> {
    // Simulate check
    await new Promise((resolve) => setTimeout(resolve, 500));

    // For now, always return true unless item name contains "Out of Stock"
    const failed = items
      .filter((i) => i.name.toLowerCase().includes("out of stock"))
      .map((i) => i.name);

    return {
      available: failed.length === 0,
      failedItems: failed,
    };
  },
};
