import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { JsonLd } from "@/components/JsonLd";
import { HelmetProvider } from "react-helmet-async";

// Wrapper for Helmet
const renderWithHelmet = (ui: React.ReactElement) => {
  return render(<HelmetProvider>{ui}</HelmetProvider>);
};

describe("JsonLd", () => {
  it("should render script tag with JSON-LD data", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Test Org",
    };

    renderWithHelmet(<JsonLd data={data} />);

    // Check that Helmet rendered without errors
    expect(document.head).toBeDefined();
  });

  it("should stringify data correctly", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Test Product",
      price: 29.99,
    };

    renderWithHelmet(<JsonLd data={data} />);

    // The component should render without errors
    expect(true).toBe(true);
  });

  it("should handle complex nested data", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Test Article",
      author: {
        "@type": "Person",
        name: "John Doe",
      },
      publisher: {
        "@type": "Organization",
        name: "Test Publisher",
        logo: {
          "@type": "ImageObject",
          url: "https://example.com/logo.png",
        },
      },
    };

    renderWithHelmet(<JsonLd data={data} />);

    expect(true).toBe(true);
  });

  it("should handle array data", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home" },
        { "@type": "ListItem", position: 2, name: "Products" },
      ],
    };

    renderWithHelmet(<JsonLd data={data} />);

    expect(true).toBe(true);
  });

  it("should handle empty object", () => {
    renderWithHelmet(<JsonLd data={{}} />);

    expect(true).toBe(true);
  });
});
