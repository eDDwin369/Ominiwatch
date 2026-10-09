import { type ReactNode } from 'react';
import { AuthProvider } from '@help/lib/auth-context';
import { HmsProvider } from '@help/components/hms/hmsStore';
import { HmsSurface } from '@help/components/hms/HmsSurface';
import { AdminPage } from '@help/pages/AdminHelpPage';
import { HelpDashboard } from '@help/pages/HelpDashboardPage';
import { UserPage } from '@help/pages/UserPage';
import { TicketsPage } from '@help/pages/TicketsPage';
import { CustomerPage } from '@help/pages/CustomerPage';

/** Providers every ported help screen needs (identity + HMS store). */
export function HelpProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <HmsProvider>{children}</HmsProvider>
    </AuthProvider>
  );
}

/** Standard wrapper for a ported page rendered as a shell view. */
function HelpView({ children }: { children: ReactNode }) {
  return (
    <div
      className="help-scope"
      style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', width: '100%' }}
    >
      <HelpProviders>{children}</HelpProviders>
    </div>
  );
}

/**
 * Hosts the ported Help Management surface (contextual help panel, right-click
 * popup, report/highlight overlays) inside the Base-application.
 *
 * Mounted once, outside the zoomed dashboard wrapper, so its fixed-position
 * overlays align to the real viewport. Everything lives under `.help-scope`,
 * which carries the scoped Tailwind tokens/reset (see help.css).
 */
export function HelpFeatureMount() {
  return (
    <div className="help-scope" data-help-root>
      <HelpProviders>
        <HmsSurface />
      </HelpProviders>
    </div>
  );
}

/** The Help Administration page (Superadmin / Help Admin). */
export function HelpAdminView() {
  return (
    <HelpView>
      <AdminPage />
    </HelpView>
  );
}

/** The help app's "Site Recordings" dashboard (tabs + data table). */
export function HelpDashboardView() {
  return (
    <HelpView>
      <HelpDashboard />
    </HelpView>
  );
}

/** Users & Access page. */
export function HelpUserView() {
  return (
    <HelpView>
      <UserPage />
    </HelpView>
  );
}

/** Support Tickets page. */
export function HelpTicketsView() {
  return (
    <HelpView>
      <TicketsPage />
    </HelpView>
  );
}

/** Customer dashboard page. */
export function HelpCustomerView() {
  return (
    <HelpView>
      <CustomerPage />
    </HelpView>
  );
}
