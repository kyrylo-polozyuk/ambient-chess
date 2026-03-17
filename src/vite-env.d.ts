/// <reference types="vite/client" />

declare module "cm-chessboard/src/Chessboard.js" {
  export const FEN: { start: string; empty: string }
  export const COLOR: { white: "w"; black: "b" }
  export const BORDER_TYPE: Record<string, string>
  export class Chessboard {
    constructor(context: HTMLElement, props?: Record<string, unknown>)
    setPosition(fen: string, animated?: boolean): Promise<void>
    setOrientation(color: "w" | "b", animated?: boolean): Promise<void>
    destroy(): void
    addMarker(type: { class: string; slice: string }, square: string): void
    removeMarkers(type?: { class: string; slice: string }, square?: string): void
    addLegalMovesMarkers(moves: { from: string; to: string }[]): void
    removeLegalMovesMarkers(): void
  }
}

declare module "cm-chessboard/src/extensions/markers/Markers.js" {
  export const MARKER_TYPE: Record<string, { class: string; slice: string }>
  export class Markers {}
}

declare module "*.png" {
  const src: string
  export default src
}

declare module "*.jpg" {
  const src: string
  export default src
}

declare module "*.jpeg" {
  const src: string
  export default src
}

declare module "*.gif" {
  const src: string
  export default src
}

declare module "*.svg" {
  const src: string
  export default src
}

declare module "*.webp" {
  const src: string
  export default src
}
