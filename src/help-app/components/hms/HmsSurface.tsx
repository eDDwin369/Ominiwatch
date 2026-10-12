import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@help/lib/auth-context";
import { HmsLauncher } from "./HmsLauncher";
import { HmsPanel } from "./HmsPanel";
import { HelpInspectorProvider } from "@help/lib/inspector-context";
import { HelpInspectorBottomBar } from "@help/components/help/HelpInspectorBottomBar";
import { VisualHelpHighlighter } from "@help/components/help/VisualHelpHighlighter";
import { RightClickHelpMenu } from "@help/components/help/RightClickHelpMenu";
import { HelpAdminRightClickModal } from "@help/components/help/HelpAdminRightClickModal";
import { PageHelpReportModal } from "@help/components/help/PageHelpReportModal";
import { HoverFocusHighlight } from "@help/components/help/HoverFocusHighlight";

/**
 * Mounts the HMS launcher + panel only where help is available:
 * signed-in application screens. The login screen never shows them.
 */
export function HmsSurface() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isLoading } = useAuth();

  if (isLoading || !user) return null;
  if (pathname.startsWith("/login")) return null;

  return (
    <HelpInspectorProvider>
      <HmsLauncher />
      <HmsPanel />
      <VisualHelpHighlighter />
      <RightClickHelpMenu />
      <HelpAdminRightClickModal />
      <PageHelpReportModal />
      <HelpInspectorBottomBar />
      <HoverFocusHighlight />
    </HelpInspectorProvider>
  );
}

