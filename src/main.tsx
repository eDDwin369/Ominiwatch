import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './help-app/help.css'
import App from './App.tsx'
import { StudioTheme } from './theme-bridge.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StudioTheme>
      <App />
    </StudioTheme>
  </StrictMode>,
)
