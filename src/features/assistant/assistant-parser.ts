import type { AssistantIntent } from "@/types/domain";
import type { Product } from "@/types/product";

const categoryAliases: Record<string, string> = { headphones: "audio", earbuds: "audio", phones: "smartphones", smartphone: "smartphones", shoes: "mens-shoes", laptops: "laptops", beauty: "beauty" };
export function parseAssistantIntent(input: string, previous?: AssistantIntent): AssistantIntent {
  const text = input.trim().toLowerCase();
  const intent: AssistantIntent = { ...previous, query: input, entities: text.split(/\s+/).filter(Boolean) };
  for (const [alias, category] of Object.entries(categoryAliases)) if (new RegExp(`\\b${alias}\\b`).test(text)) intent.category = category;
  const price = text.match(/(?:under|below|less than|max(?:imum)?|upto|up to)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i);
  if (price) intent.maxPrice = Number(price[1].replace(/,/g, "")) / 84;
  if (/\b(?:good|high|better|top|best)\s*(?:rating|rated)?\b/.test(text)) intent.minRating = Math.max(previous?.minRating ?? 0, 4);
  if (/\b(?:cheaper|less expensive)\b/.test(text)) intent.refinement = "cheaper";
  if (/\b(?:more expensive|pricier)\b/.test(text)) intent.refinement = "more-expensive";
  if (/\b(?:better ratings?|higher rated)\b/.test(text)) intent.refinement = "better-rated";
  const color = text.match(/\b(red|blue|black|white|green|pink|yellow|brown|silver)\b/);
  if (color) intent.color = color[1];
  const reference = text.match(/(?:second|2nd|first|1st|third|3rd)\s*(?:one|item|product)/);
  if (reference) intent.referenceProductId = Number(reference[1].startsWith("s") ? 2 : reference[1].startsWith("t") ? 3 : 1);
  return intent;
}

export function resolveAssistantProducts(products: Product[], intent: AssistantIntent, previousResults: Product[] = []) {
  if (!intent.category && intent.maxPrice === undefined && intent.minRating === undefined && !intent.refinement && !intent.color) return [];
  let candidates = products.filter((product) => product.stock > 0);
  if (intent.category) {
    const category = intent.category;
    candidates = candidates.filter((product) => product.category === category || product.title.toLowerCase().includes(category) || product.tags?.some((tag) => tag.toLowerCase().includes(category)));
  }
  if (intent.maxPrice !== undefined) candidates = candidates.filter((product) => product.price <= intent.maxPrice!);
  if (intent.minRating !== undefined) candidates = candidates.filter((product) => product.rating >= intent.minRating!);
  if (intent.color) candidates = candidates.filter((product) => product.title.toLowerCase().includes(intent.color!) || product.description.toLowerCase().includes(intent.color!) || product.tags?.some((tag) => tag.toLowerCase().includes(intent.color!)));
  if (intent.refinement === "cheaper") candidates = candidates.filter((product) => product.price <= (intent.maxPrice ?? Math.max(...previousResults.map((item) => item.price), 0)) * 0.8);
  if (intent.refinement === "more-expensive") candidates = candidates.filter((product) => product.price >= (intent.maxPrice ?? 0) * 1.1);
  if (intent.refinement === "better-rated") candidates = candidates.sort((a, b) => b.rating - a.rating);
  return candidates.sort((a, b) => b.rating - a.rating || a.price - b.price).slice(0, 6);
}

export function assistantResponse(intent: AssistantIntent, count: number) {
  if (!intent.category && intent.maxPrice === undefined && intent.minRating === undefined && !intent.refinement && !intent.color) return "I can help you find products. Try “headphones under 5000” or “laptops with good ratings”.";
  if (!count) return "I couldn't find an in-stock match. Try a broader category, a higher price, or fewer filters.";
  const filters = [intent.category, intent.maxPrice !== undefined ? `under ₹${Math.round(intent.maxPrice * 84).toLocaleString("en-IN")}` : "", intent.minRating ? `${intent.minRating}+ stars` : "", intent.color].filter(Boolean).join(", ");
  return `${intent.refinement ? `Refined for ${intent.refinement.replace("-", " ")}. ` : ""}Here are ${filters ? `matches for ${filters}` : "some relevant matches"}.`;
}
