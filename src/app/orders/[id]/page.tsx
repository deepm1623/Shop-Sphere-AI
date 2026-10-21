import { ProtectedRoute } from "@/features/auth/protected-route";
import { OrderDetailPage } from "@/features/orders/order-detail-page";

export default function OrderDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  return <ProtectedRoute><OrderDetailRouteContent params={params} /></ProtectedRoute>;
}

async function OrderDetailRouteContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailPage id={id} />;
}
