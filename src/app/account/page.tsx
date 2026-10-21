import { ProtectedRoute } from "@/features/auth/protected-route";
import { AccountPage } from "@/features/auth/account-page";

export default function AccountRoute() {
  return <ProtectedRoute><AccountPage /></ProtectedRoute>;
}
