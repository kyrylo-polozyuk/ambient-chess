import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { DialogProvider } from "./dialog/dialog-context";
import "./style.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DialogProvider>
      <App />
    </DialogProvider>
  </StrictMode>,
);
