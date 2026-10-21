import { ProtectedRoute } from "@/features/auth/protected-route";
import { OrdersPage } from "@/features/orders/order-page";

export default function OrdersRoute() {
  return <ProtectedRoute><OrdersPage /></ProtectedRoute>;
}
