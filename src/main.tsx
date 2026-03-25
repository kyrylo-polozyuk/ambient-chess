import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { AppWrapper } from "./AppWrapper"
import "./css/buttons.css"
import "./css/index.css"
import "./css/layout.css"
import "./css/typography.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>,
)
