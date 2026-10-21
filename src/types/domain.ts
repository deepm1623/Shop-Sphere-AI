import type { Product } from "@/types/product";

export type CartItem = {
  product: Product;
  quantity: number;
  unitPrice: number;
  originalUnitPrice: number;
  addedAt: string;
  savedForLater?: boolean;
};

export type PricingBreakdown = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode?: string;
};

export type UserRole = "customer" | "administrator";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
};

export type AuthSession = {
  token: string;
  user: MockUser;
  expiresAt: string;
};

export type ShippingAddress = {
  id: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
};

export type DeliveryMethod = {
  id: string;
  label: string;
  eta: string;
  price: number;
};

export type CheckoutState = {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  checkoutId?: string;
  customer: Pick<MockUser, "name" | "email" | "phone">;
  address?: ShippingAddress;
  deliveryMethod?: DeliveryMethod;
  pricing?: PricingBreakdown;
  paymentMethod?: "mock-card" | "mock-upi" | "cash-on-delivery";
};

export type OrderStatus = "placed" | "confirmed" | "packed" | "shipped" | "out-for-delivery" | "delivered" | "cancelled";

export type Order = {
  id: string;
  checkoutId?: string;
  customerId: string;
  items: CartItem[];
  pricing: PricingBreakdown;
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type RecommendationReason = {
  signal: "category" | "price" | "tag" | "rating" | "recently-viewed" | "wishlist" | "cart" | "trending" | "co-purchase" | "brand";
  label: string;
  score: number;
};

export type RecommendationResult = {
  product: Product;
  score: number;
  reasons: RecommendationReason[];
  strategy: "recently-viewed" | "similar" | "category-based" | "price-based" | "wishlist-based" | "cart-based" | "frequently-bought-together" | "trending" | "personalized";
};

export type AssistantIntent = {
  query?: string;
  category?: string;
  maxPrice?: number;
  minRating?: number;
  color?: string;
  referenceProductId?: number;
  refinement?: "cheaper" | "more-expensive" | "better-rated";
  entities?: string[];
};

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: AssistantIntent;
  products?: Product[];
  createdAt: string;
};

export type ReviewStatus = "pending" | "approved" | "rejected";
export type ProductReview = {
  id: string;
  productId: number;
  customerId: string;
  customerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  helpful: number;
  notHelpful: number;
  createdAt: string;
};

export type UserProfile = Pick<MockUser, "name" | "email" | "phone" | "avatar">;
