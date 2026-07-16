const PRINTIFY_API = "https://api.printify.com/v1";
const PRINTIFY_KEY = process.env.PRINTIFY_API_KEY!;
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID!;

export type PrintifyBlueprint = {
  id: number;
  title: string;
  description: string;
  images: string[];
};

export type PrintifyVariant = {
  id: number;
  title: string;
  options: Record<string, string | number>;
};

export type PrintifyOrderPayload = {
  line_items: {
    blueprint_id: number;
    print_provider_id: number;
    variant_id: number;
    print_areas: { front?: { src: string } };
    quantity: number;
  }[];
  shipping_method: number;
  address_to: {
    first_name: string;
    last_name: string;
    email: string;
    address1: string;
    city: string;
    zip: string;
    country: string;
  };
};

export type PrintifyOrderResponse = {
  id: string;
  status: string;
};

export async function getPrintifyProducts(query?: string): Promise<PrintifyBlueprint[]> {
  const res = await fetch(`${PRINTIFY_API}/catalog/blueprints.json`, {
    headers: { Authorization: `Bearer ${PRINTIFY_KEY}` },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Printify catalog error: ${res.status}`);
  const data = await res.json();
  const blueprints: PrintifyBlueprint[] = Array.isArray(data) ? data : data.data || [];
  if (!query) return blueprints;
  const q = query.toLowerCase();
  return blueprints.filter((b) => b.title.toLowerCase().includes(q));
}

export async function getPrintifyProviders(blueprintId: number): Promise<number[]> {
  const res = await fetch(`${PRINTIFY_API}/catalog/blueprints/${blueprintId}/print_providers.json`, {
    headers: { Authorization: `Bearer ${PRINTIFY_KEY}` },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Printify providers error: ${res.status}`);
  const data = await res.json();
  const providers: { id: number }[] = Array.isArray(data) ? data : [];
  return providers.map((p) => p.id);
}

export async function getPrintifyVariants(blueprintId: number, printProviderId: number): Promise<PrintifyVariant[]> {
  const res = await fetch(
    `${PRINTIFY_API}/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`,
    {
      headers: { Authorization: `Bearer ${PRINTIFY_KEY}` },
      next: { revalidate: 86400 },
    }
  );
  if (!res.ok) throw new Error(`Printify variants error: ${res.status}`);
  const data = await res.json();
  return data?.variants || [];
}

export async function createPrintifyOrder(order: PrintifyOrderPayload): Promise<PrintifyOrderResponse> {
  const res = await fetch(`${PRINTIFY_API}/shops/${PRINTIFY_SHOP_ID}/orders.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PRINTIFY_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Printify order failed: ${err}`);
  }
  return res.json();
}
