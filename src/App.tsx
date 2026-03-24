import './App.css'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { readSavedTexts, writeSavedTexts } from './savedTextsCookie'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [saveNameInput, setSaveNameInput] = useState('')
  const [savedTexts, setSavedTexts] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
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

  useEffect(() => {
    setSavedTexts(readSavedTexts())
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const handleSaveCurrent = useCallback(() => {
    const name = saveNameInput.trim()
    if (!name) {
      setSaveError('Enter a name for this save.')
      return
    }
    const next = { ...savedTexts, [name]: value }
    const result = writeSavedTexts(next)
    if (!result.ok) {
      setSaveError('Could not save — text may be too large for browser storage.')
      return
    }
    setSavedTexts(next)
    setSaveError(null)
    setSaveNameInput('')
  }, [saveNameInput, savedTexts, value])

  const handleLoadSaved = useCallback((name: string) => {
    const text = savedTexts[name]
    if (text === undefined) return
    setValue(text)
    setMenuOpen(false)
  }, [savedTexts])

  const handleDeleteSaved = useCallback(
    (name: string) => {
      const next = { ...savedTexts }
      delete next[name]
      const result = writeSavedTexts(next)
      if (!result.ok) return
      setSavedTexts(next)
    },
    [savedTexts],
  )

  return (
    <>
      <header className="top-bar">
        <div className="top-bar__start">
          <button
            type="button"
            className="top-bar__menu-btn"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg
              className="top-bar__hamburger"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                fill="currentColor"
                d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"
              />
            </svg>
          </button>
        </div>
        <span className="top-bar__brand">Memorare</span>
        <div className="top-bar__end" aria-hidden />
      </header>
      {menuOpen ? (
        <button
          type="button"
          className="top-bar__backdrop"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <nav
        id="site-menu"
        className={`top-bar-drawer${menuOpen ? ' top-bar-drawer--open' : ''}`}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className="top-bar-drawer__inner">
          <p className="top-bar-drawer__heading">Saved texts</p>
          <div className="top-bar-drawer__save-row">
            <label className="top-bar-drawer__field-label" htmlFor="save-name">
              Name
            </label>
            <input
              id="save-name"
              className="top-bar-drawer__input"
              type="text"
              value={saveNameInput}
              placeholder="Name this save"
              autoComplete="off"
              onChange={(e) => {
                setSaveNameInput(e.target.value)
                setSaveError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSaveCurrent()
                }
              }}
            />
            <button
              type="button"
              className="top-bar-drawer__save-btn"
              onClick={handleSaveCurrent}
            >
              Save current text
            </button>
          </div>
          {saveError ? (
            <p className="top-bar-drawer__error" role="alert">
              {saveError}
            </p>
          ) : null}
          {Object.keys(savedTexts).length === 0 ? (
            <p className="top-bar-drawer__empty">No saved texts yet.</p>
          ) : (
            <ul className="top-bar-drawer__list">
              {Object.keys(savedTexts)
                .sort((a, b) => a.localeCompare(b))
                .map((name) => (
                  <li key={name} className="top-bar-drawer__list-item">
                    <button
                      type="button"
                      className="top-bar-drawer__load-btn"
                      onClick={() => handleLoadSaved(name)}
                    >
                      {name}
                    </button>
                    <button
                      type="button"
                      className="top-bar-drawer__delete-btn"
                      aria-label={`Delete save “${name}”`}
                      onClick={() => handleDeleteSaved(name)}
                    >
                      ×
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </nav>
      <main className="app">
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
    </>
  )
}

export default App
