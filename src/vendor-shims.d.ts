// The two workspace packages ship no .d.ts. Minimal ambient declarations so
// TS stops flagging them as implicit-any imports (TS7016). Types are loose on
// purpose — these are external prebuilt bundles, not source we type-check.
declare module 'dts-universal-report-module' {
  import type { ComponentType } from 'react';
  export const URMBuilder: ComponentType<any>;
  export const URMBuilderRaw: ComponentType<any>;
  export const URMViewer: ComponentType<any>;
  export const URMViewerRaw: ComponentType<any>;
  export const URMProvider: ComponentType<any>;
  export const useURMContext: (...args: any[]) => any;
}

declare module 'omnieye-theme-studio' {
  import type { ComponentType } from 'react';
  export const ThemeStudio: ComponentType<any>;
  export const useThemeStore: (<T = any>(selector: (state: any) => T) => T) & {
    getState: () => any;
    setState: (partial: any) => void;
  };
  export const buildMuiTheme: (settings: any) => any;
  export const DEFAULT_SETTINGS: any;
}
