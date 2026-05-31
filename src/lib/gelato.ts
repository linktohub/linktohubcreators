const GELATO_API = "https://product.gelatoapis.com/v3";
const GELATO_KEY = process.env.GELATO_API_KEY!;

export async function getGelatoProducts(query?: string): Promise<GelatoProduct[]> {
  const url = new URL(`${GELATO_API}/products`);
  if (query) url.searchParams.set("query", query);

  const res = await fetch(url.toString(), {
    headers: { "X-API-KEY": GELATO_KEY },
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`Gelato API error: ${res.status}`);
  const data = await res.json();
  return data.products || [];
}

export async function getGelatoProduct(productId: string): Promise<GelatoProduct> {
  const res = await fetch(`${GELATO_API}/products/${productId}`, {
    headers: { "X-API-KEY": GELATO_KEY },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Gelato product not found: ${productId}`);
  return res.json();
}

export async function createGelatoOrder(order: GelatoOrderPayload): Promise<GelatoOrderResponse> {
  const res = await fetch("https://order.gelatoapis.com/v4/orders", {
    method: "POST",
    headers: {
      "X-API-KEY": GELATO_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gelato order failed: ${err}`);
  }
  return res.json();
}

export type GelatoProduct = {
  productUid: string;
  title: string;
  description: string;
  imagePlaceholders: { name: string; width: number; height: number }[];
  variants: GelatoVariant[];
};

export type GelatoVariant = {
  variantUid: string;
  title: string;
  options: Record<string, string>;
  imagePlaceholders: { name: string; width: number; height: number }[];
};

export type GelatoOrderPayload = {
  orderReferenceId: string;
  customerReferenceId: string;
  currency: string;
  items: {
    itemReferenceId: string;
    productUid: string;
    variantUid: string;
    quantity: number;
    files: { type: string; url: string }[];
  }[];
  shipmentMethodUid?: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    city: string;
    postCode: string;
    country: string;
    email: string;
  };
};

export type GelatoOrderResponse = {
  id: string;
  orderReferenceId: string;
  status: string;
  shipments?: { trackingCode: string; trackingUrl: string }[];
};
