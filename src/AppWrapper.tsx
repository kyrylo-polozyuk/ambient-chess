import { App } from "./App"
import { DialogProvider } from "./dialog/DialogContext"
import { ErrorBoundary } from "./errors/ErrorBoundary"
import { ErrorHandler } from "./errors/ErrorHandler"

export const AppWrapper = () => (
  <DialogProvider>
    <ErrorHandler />
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </DialogProvider>
)
