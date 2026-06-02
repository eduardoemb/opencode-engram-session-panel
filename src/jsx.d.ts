declare namespace JSX {
  type Element = unknown

  interface IntrinsicElements {
    box: Record<string, unknown>
    text: Record<string, unknown>
  }
}
