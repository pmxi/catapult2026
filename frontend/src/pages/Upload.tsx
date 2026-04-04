import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import ProcessingAnimation from '../components/ProcessingAnimation'

interface ComparisonResult {
  original_filename: string
  original_annotated_url: string | null
  original_face_url: string | null
  tweaked_face_url: string | null
  deepface: {
    verified: boolean
    distance: number
    similarity: number
    model: string
    threshold: number
  }
  insightface: {
    similarity: number
    distance: number
  }
}

interface ProcessResponse {
  tweaked_image_url: string
  tweaked_annotated_url: string | null
  download_name: string
  comparisons: ComparisonResult[]
}

function Upload() {
  const [originalFiles, setOriginalFiles] = useState<File[]>([])
  const [targetFile, setTargetFile] = useState<File | null>(null)
  const [results, setResults] = useState<ProcessResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const originalInputRef = useRef<HTMLInputElement>(null)
  const targetInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleOriginalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setOriginalFiles((prev) => [...prev, ...newFiles])
    }
    e.target.value = ''
  }

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTargetFile(e.target.files[0])
    }
    e.target.value = ''
  }

  const removeOriginal = (index: number) => {
    setOriginalFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeTarget = () => {
    setTargetFile(null)
  }

  const handleProcess = async () => {
    if (!targetFile || originalFiles.length === 0) return

    setLoading(true)
    setResults(null)
    setError(null)
    setElapsed(null)

    const start = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed(Math.round((Date.now() - start) / 1000))
    }, 1000)

    try {
      const formData = new FormData()
      originalFiles.forEach((f) => formData.append('original_files', f))
      formData.append('target_file', targetFile)

      const res = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Processing failed')
      }

      const data: ProcessResponse = await res.json()
      setResults(data)
      setElapsed(Math.round((Date.now() - start) / 1000))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const handleDownload = async () => {
    if (!results) return
    const res = await fetch(results.tweaked_image_url)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = results.download_name
    a.click()
    URL.revokeObjectURL(url)
  }

  const getPreviewUrl = (file: File) => URL.createObjectURL(file)

  const getScoreColor = (similarity: number) => {
    const protection = 1 - similarity
    if (protection >= 0.7) return 'bg-primary'
    if (protection >= 0.4) return 'bg-tertiary'
    return 'bg-error'
  }

  const getScoreTextColor = (similarity: number) => {
    const protection = 1 - similarity
    if (protection >= 0.7) return 'text-primary'
    if (protection >= 0.4) return 'text-tertiary'
    return 'text-error'
  }

  const getShieldLevel = (similarity: number) => {
    const protection = 1 - similarity
    if (protection >= 0.9) return 'Total Obfuscation'
    if (protection >= 0.7) return 'Maximum Resilience'
    if (protection >= 0.4) return 'High Security'
    return 'Moderate Protection'
  }

  const resetAll = () => {
    setOriginalFiles([])
    setTargetFile(null)
    setResults(null)
    setElapsed(null)
    setError(null)
  }

  return (
    <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto space-y-20 font-body">
      {/* Header */}
      <header className="text-center space-y-4">
        <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary tracking-tight">
          The Upload Tool.
        </h1>
        <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Invisible protection for your visual identity. Transform your photos
          into AI-resistant assets in seconds.
        </p>
      </header>

      {/* Step 1: Upload Zone */}
      <section className="space-y-8">
        <div className="flex items-center space-x-4 mb-2">
          <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
            1
          </span>
          <h2 className="font-headline text-2xl font-bold">Secure Upload</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original faces */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-on-surface-variant">
              Reference Photos (for comparison)
            </p>
            <div
              onClick={() => originalInputRef.current?.click()}
              className="group relative bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-[1rem] p-8 md:p-12 transition-all hover:border-primary cursor-pointer flex flex-col items-center justify-center text-center"
            >
              <input
                ref={originalInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleOriginalChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">
                  photo_library
                </span>
              </div>
              <h3 className="font-headline text-lg font-semibold mb-1">
                Original face(s)
              </h3>
              <p className="text-on-surface-variant text-sm">
                Upload reference photos for comparison
              </p>
            </div>
            {originalFiles.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {originalFiles.map((f, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={getPreviewUrl(f)}
                      alt={f.name}
                      className="w-full aspect-square object-cover rounded-[0.75rem] border border-outline-variant/30"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeOriginal(i)
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Target face */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-on-surface-variant">
              Photo to Protect
            </p>
            {targetFile ? (
              <div className="relative bg-surface-container-lowest border-2 border-primary rounded-[1rem] p-4 flex flex-col items-center">
                <div className="relative group">
                  <img
                    src={getPreviewUrl(targetFile)}
                    alt={targetFile.name}
                    className={`max-h-48 object-cover rounded-[0.75rem] ${loading ? 'border-2 border-primary/50' : ''}`}
                  />
                  {loading && (
                    <div className="scan-overlay">
                      <div className="scan-grid" />
                      <div className="scan-line-h" />
                      <div className="scan-line-v" />
                    </div>
                  )}
                  {!loading && (
                    <button
                      onClick={removeTarget}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-error rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant mt-3 truncate max-w-full">
                  {targetFile.name}
                </p>
                <div className="absolute top-3 right-3">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => targetInputRef.current?.click()}
                className="group relative bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-[1rem] p-8 md:p-12 transition-all hover:border-primary cursor-pointer flex flex-col items-center justify-center text-center"
              >
                <input
                  ref={targetInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleTargetChange}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    cloud_upload
                  </span>
                </div>
                <h3 className="font-headline text-lg font-semibold mb-1">
                  Face to protect
                </h3>
                <p className="text-on-surface-variant text-sm">
                  JPG or PNG &middot; Max 25MB
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Step 2: Process Button */}
      <section className="flex flex-col items-center space-y-6">
        <button
          onClick={handleProcess}
          disabled={loading || !targetFile || originalFiles.length === 0}
          className="w-full bg-primary text-on-primary py-5 rounded-full text-xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-3"
        >
          <span>
            {loading
              ? `Processing... (${elapsed ?? 0}s)`
              : elapsed !== null
                ? `Processed (${elapsed}s)`
                : 'Poison My Photo \u2192'}
          </span>
        </button>
        <p className="text-on-surface-variant text-sm flex items-center">
          <span className="material-symbols-outlined text-sm mr-2">lock</span>
          Encrypted end-to-end. We never store your raw data.
        </p>
      </section>

      {/* Processing animation */}
      {loading && targetFile && (
        <ProcessingAnimation
          originalFiles={originalFiles}
          targetFile={targetFile}
        />
      )}

      {/* Error */}
      {error && (
        <div className="p-6 bg-error-container border border-error/20 rounded-[1rem] text-on-error-container">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error">error</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <section className="bg-surface-container-low rounded-[1rem] overflow-hidden p-8 md:p-16 space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end space-y-6 md:space-y-0">
            <div>
              <h2 className="font-headline text-4xl font-bold mb-2">
                Protection Analysis
              </h2>
              <p className="text-on-surface-variant text-lg">
                {results.comparisons.length} comparison
                {results.comparisons.length !== 1 ? 's' : ''} completed
                successfully.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="bg-primary text-on-primary px-8 py-3 rounded-full font-semibold flex items-center hover:scale-[1.02] transition-transform"
            >
              <span className="material-symbols-outlined mr-2">download</span>
              Download Protected Photo
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Image comparison */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex gap-4 items-start flex-wrap">
                {results.tweaked_annotated_url && (
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-xs text-on-surface-variant mb-2 uppercase tracking-widest font-bold">
                      Face Detection
                    </p>
                    <img
                      src={results.tweaked_annotated_url}
                      alt="Tweaked with detection"
                      className="rounded-[1rem] w-full object-cover shadow-lg"
                    />
                  </div>
                )}
                {results.tweaked_image_url && (
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-xs text-on-surface-variant mb-2 uppercase tracking-widest font-bold">
                      Protected Output
                    </p>
                    <img
                      src={results.tweaked_image_url}
                      alt="Tweaked"
                      className="rounded-[1rem] w-full object-cover shadow-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Score gauges */}
            <div className="flex flex-col justify-center space-y-6">
              {results.comparisons.map((comp, i) => {
                const avgSimilarity =
                  (comp.deepface.similarity + comp.insightface.similarity) / 2
                const protection = ((1 - avgSimilarity) * 100).toFixed(1)

                return (
                  <div
                    key={i}
                    className="bg-surface-container-lowest p-6 rounded-[1rem] shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold">
                        vs. {comp.original_filename}
                      </span>
                      <span className={`font-bold ${getScoreTextColor(avgSimilarity)}`}>
                        {protection}%
                      </span>
                    </div>
                    <div className="relative h-3 bg-surface-container-low rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${getScoreColor(avgSimilarity)}`}
                        style={{ width: `${protection}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-on-surface-variant">
                      <span>Shield: {getShieldLevel(avgSimilarity)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-outline-variant/10">
                      <div>
                        <p className="text-xs text-on-surface-variant">DeepFace</p>
                        <p className={`text-sm font-bold ${getScoreTextColor(comp.deepface.similarity)}`}>
                          {((1 - comp.deepface.similarity) * 100).toFixed(1)}% protected
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-on-surface-variant">InsightFace</p>
                        <p className={`text-sm font-bold ${getScoreTextColor(comp.insightface.similarity)}`}>
                          {((1 - comp.insightface.similarity) * 100).toFixed(1)}% protected
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <button
                onClick={resetAll}
                className="text-primary font-bold text-center hover:underline"
              >
                Protect Another Photo
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

export default Upload
