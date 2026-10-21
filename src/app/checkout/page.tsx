import { ProtectedRoute } from "@/features/auth/protected-route";
import { CheckoutPage } from "@/features/checkout/checkout-page";

export default function CheckoutRoute() {
  return <ProtectedRoute><CheckoutPage /></ProtectedRoute>;
}
