import './App.css'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { setMeasureToOutputWidth, splitVisualLines } from './splitVisualLines'

function renderOutputLineWithMatch(line: string, typed: string) {
  const typedChars = Array.from(typed)
  const lineChars = Array.from(line)
  if (lineChars.length === 0) {
    return (
      <span
        className={
          typed === '' ? 'output-char-pending' : 'output-char-mismatch'
        }
      >
        {'\u00a0'}
      </span>
    )
  }
  return lineChars.map((char, j) => {
    const t = typedChars[j]
    let cls: string
    if (t === undefined) cls = 'output-char-pending'
    else if (t === char) cls = 'output-char-match'
    else cls = 'output-char-mismatch'
    return (
      <span key={j} className={cls}>
        {char}
      </span>
    )
  })
}

function App() {
  const [value, setValue] = useState('')
  const [lineInputs, setLineInputs] = useState<string[]>([])
  const [visualLines, setVisualLines] = useState<string[]>([])

  const outputRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const lineInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const prevLineInputsRef = useRef<string[] | null>(null)
  const visualLinesSigRef = useRef<string>('')

  const recomputeVisualLines = useCallback(() => {
    const output = outputRef.current
    const measure = measureRef.current
    if (!output || !measure) return
    if (!value) {
      setVisualLines([])
      return
    }
    if (!output.clientWidth) return
    setMeasureToOutputWidth(output, measure)
    setVisualLines(splitVisualLines(value, measure))
  }, [value])

  useLayoutEffect(() => {
    if (!value) {
      setVisualLines([])
      return
    }
    const output = outputRef.current
    if (!output) return
    const ro = new ResizeObserver(() => {
      recomputeVisualLines()
    })
    ro.observe(output)
    recomputeVisualLines()
    return () => ro.disconnect()
  }, [value, recomputeVisualLines])

  useEffect(() => {
    if (!value) {
      setLineInputs([])
      return
    }
    const n = visualLines.length
    setLineInputs((prev) => {
      if (prev.length === n) return prev
      const next = prev.slice(0, n)
      while (next.length < n) next.push('')
      return next
    })
  }, [value, visualLines.length])

  useLayoutEffect(() => {
    if (!value) {
      prevLineInputsRef.current = null
      visualLinesSigRef.current = ''
      return
    }
    if (lineInputs.length !== visualLines.length) {
      prevLineInputsRef.current = lineInputs.length ? [...lineInputs] : null
      visualLinesSigRef.current = visualLines.join('\n\u0000')
      return
    }

    const sig = visualLines.join('\n\u0000')
    if (sig !== visualLinesSigRef.current) {
      visualLinesSigRef.current = sig
      prevLineInputsRef.current = [...lineInputs]
      return
    }

    const prev = prevLineInputsRef.current
    prevLineInputsRef.current = [...lineInputs]
    if (!prev || prev.length !== lineInputs.length) return

    for (let i = 0; i < lineInputs.length; i++) {
      const target = visualLines[i]
      if (target === '') continue
      if (lineInputs[i] !== target) continue
      if (prev[i] === target) continue
      const nextEl = lineInputRefs.current[i + 1]
      if (nextEl) {
        nextEl.focus()
        nextEl.scrollIntoView({
          block: 'center',
          inline: 'nearest',
          behavior: 'smooth',
        })
      }
      break
    }
  }, [lineInputs, visualLines, value])

  return (
    <main className="app">
      <h1 className="title">Memorare</h1>
      <div className="panel">
        <textarea
          id="memorare-input"
          className="textbox"
          value={value}
          placeholder="Type something..."
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      {value ? (
        <div ref={outputRef} className="output" aria-live="polite">
          <div
            ref={measureRef}
            className="output-line-text measure-mirror-output"
            aria-hidden
          />
          {visualLines.map((line, i) => (
            <div key={i} className="output-line">
              <div className="output-line-body">
                <div className="output-line-text">
                  {renderOutputLineWithMatch(line, lineInputs[i] ?? '')}
                </div>
                <input
                  ref={(el) => {
                    lineInputRefs.current[i] = el
                  }}
                  className="output-line-input"
                  type="text"
                  value={lineInputs[i] ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setLineInputs((prev) => {
                      const next = [...prev]
                      next[i] = v
                      return next
                    })
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== 'Backspace' || i === 0) return
                    const el = e.currentTarget
                    if (el.selectionStart !== 0 || el.selectionEnd !== 0) return
                    e.preventDefault()
                    const prevEl = lineInputRefs.current[i - 1]
                    if (!prevEl) return
                    prevEl.focus()
                    const len = prevEl.value.length
                    prevEl.setSelectionRange(len, len)
                  }}
                  aria-label={`Input under wrapped line ${i + 1}`}
                />
              </div>
              <hr className="output-line-rule" aria-hidden />
            </div>
          ))}
        </div>
      ) : null}
    </main>
  )
}

export default App
