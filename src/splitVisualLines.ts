/**
 * Split text into visual lines as it wraps in `measureEl`.
 * The element should use the same width and typography as the preview (e.g. `.output-line-text`).
 */
export function splitVisualLines(text: string, measureEl: HTMLDivElement): string[] {
  measureEl.textContent = text
  const textNode = measureEl.firstChild
  if (!text) return []
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return []

  const range = document.createRange()
  const lines: string[] = []
  let lineStart = 0

  range.setStart(textNode, 0)
  range.setEnd(textNode, 0)
  let prevTop = range.getBoundingClientRect().top

  for (let i = 1; i <= text.length; i++) {
    range.setStart(textNode, i)
    range.setEnd(textNode, i)
    const top = range.getBoundingClientRect().top
    if (top > prevTop + 0.5) {
      lines.push(text.slice(lineStart, i))
      lineStart = i
    }
    prevTop = top
  }
  lines.push(text.slice(lineStart))
  return lines
}

/** Match `measureEl` width to the output column so wrapping matches the preview. */
export function setMeasureToOutputWidth(
  output: HTMLElement,
  measure: HTMLDivElement,
): void {
  measure.style.width = `${output.clientWidth}px`
  measure.style.boxSizing = 'border-box'
  measure.style.whiteSpace = 'pre-wrap'
  measure.style.wordBreak = 'normal'
}
