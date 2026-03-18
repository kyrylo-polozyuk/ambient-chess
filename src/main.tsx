import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { AppWrapper } from "./AppWrapper"
import "./css/index.css"
import "./css/typography.css"
import "./css/layout.css"
import "./css/buttons.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>
)
