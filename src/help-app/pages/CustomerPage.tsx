import { useNavigate } from "@tanstack/react-router";
import { UserCheck } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@help/lib/auth-context";
import { ModernUserDashboard } from "@help/components/admin/ModernUserDashboard";
import { useHmsStore } from "@help/components/hms/hmsStore";

const CUSTOMER_URL = "https://help-management-flows.lovable.app/customer";
const CUSTOMER_TITLE = "Customer Dashboard · OomniEye";
const CUSTOMER_DESC =
  "Customer operational digital twin dashboard with interactive review queue, widget customization, and operational telemetry.";


export function CustomerPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { setSection } = useHmsStore();

  useEffect(() => {
    setSection("section-customer-dashboard");
  }, [setSection]);

  if (isLoading || !user) return null;

  return (
    <div className="h-full w-full min-w-0 flex flex-col overflow-hidden bg-background text-foreground">
      <div className="p-6 max-w-[1600px] mx-auto relative h-full flex flex-col min-h-0 overflow-hidden space-y-3">
        <h1 className="sr-only">Customer Dashboard</h1>
        <div className="flex-1 min-h-0 overflow-hidden">
          <ModernUserDashboard
            title="Customer"
            icon={<UserCheck size={20} />}
            onOpenReview={() => {
              navigate({ to: "/admin", search: { tab: "content" } });
            }}
          />
        </div>
      </div>
    </div>
  );
}
