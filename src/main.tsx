import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"
import "./css/index.css"
import "./css/typography.css"
import "./css/layout.css"
import "./css/buttons.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App>
    </App>
  </StrictMode>
)
