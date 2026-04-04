import { useState, useRef } from 'react'
import ProcessingAnimation from '../components/ProcessingAnimation'
import ComparisonSlider from '../components/ComparisonSlider'

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

function Tool() {
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
      const file = e.target.files[0]
      setTargetFile(file)
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

      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/process`, {
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
    const url_prefix = results.tweaked_image_url.startsWith('http') ? '' : (import.meta.env.VITE_API_URL || '')
    const res = await fetch(`${url_prefix}${results.tweaked_image_url}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = results.download_name
    a.click()
    URL.revokeObjectURL(url)
  }

  const similarityColor = (score: number) => {
    if (score < 0.3) return 'text-green-600'
    if (score < 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const similarityBarColor = (score: number) => {
    if (score < 0.3) return 'bg-green-500'
    if (score < 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getPreviewUrl = (file: File) => URL.createObjectURL(file)

  return (
    <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto bg-background text-on-surface font-body">
      {/* Header */}
      <header className="text-center space-y-4 mb-16">
        <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary tracking-tight">
          The Upload Tool.
        </h1>
        <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Invisible protection for your visual identity. Transform your photos
          into AI-resistant assets in seconds.
        </p>
      </header>

      {/* Upload Section */}
      <section className="space-y-8 mb-12">
        <div className="flex items-center space-x-4 mb-2">
          <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
            1
          </span>
          <h2 className="font-headline text-2xl font-bold">Secure Upload</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Original faces */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Original Face(s)</h3>
            <p className="text-sm text-on-surface-variant mb-3">
              Upload reference photos for comparison.
            </p>
            <div
              onClick={() => originalInputRef.current?.click()}
              className="border-2 border-dashed border-outline-variant rounded-[1rem] p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
            >
              <input
                ref={originalInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleOriginalChange}
                className="hidden"
              />
              <span
                className="material-symbols-outlined text-primary text-4xl mb-2 block"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                cloud_upload
              </span>
              <p className="text-on-surface-variant">
                Click to upload or drag and drop
              </p>
            </div>
            {originalFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {originalFiles.map((f, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={getPreviewUrl(f)}
                      alt={f.name}
                      className="w-full h-24 object-cover rounded-lg border border-outline-variant"
                    />
                    <button
                      onClick={() => removeOriginal(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      X
                    </button>
                    <p className="text-xs text-on-surface-variant mt-1 truncate">
                      {f.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Target face */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Face to Tweak</h3>
            <p className="text-sm text-on-surface-variant mb-3">
              Upload the photo to protect with adversarial encoding.
            </p>
            {targetFile ? (
              <div>
                <div className="relative inline-block group">
                  <img
                    src={getPreviewUrl(targetFile)}
                    alt={targetFile.name}
                    className={`max-h-48 object-cover rounded-xl border ${loading ? 'border-green-500/50' : 'border-outline-variant'}`}
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
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      X
                    </button>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant mt-2 truncate">
                  {targetFile.name}
                </p>
              </div>
            ) : (
              <div
                onClick={() => targetInputRef.current?.click()}
                className="border-2 border-dashed border-outline-variant rounded-[1rem] p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
              >
                <input
                  ref={targetInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleTargetChange}
                  className="hidden"
                />
                <span
                  className="material-symbols-outlined text-primary text-4xl mb-2 block"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                >
                  cloud_upload
                </span>
                <p className="text-on-surface-variant">
                  Click to upload or drag and drop
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Process Button */}
      <button
        onClick={handleProcess}
        disabled={loading || !targetFile || originalFiles.length === 0}
        className="w-full bg-primary text-on-primary py-5 rounded-full text-xl font-bold hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-3"
      >
        <span>
          {loading
            ? `Processing... (${elapsed ?? 0}s)`
            : elapsed !== null
              ? `Processed (${elapsed}s)`
              : 'Poison My Photo \u2192'}
        </span>
      </button>
      <p className="text-center text-on-surface-variant text-sm mt-3 flex items-center justify-center gap-1">
        <span
          className="material-symbols-outlined text-sm"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
        >
          lock
        </span>
        Encrypted end-to-end. We never store your raw data.
      </p>

      {/* Processing Animation */}
      {loading && targetFile && (
        <ProcessingAnimation
          originalFiles={originalFiles}
          targetFile={targetFile}
        />
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-error-container border border-error/30 rounded-[1rem] text-error">
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <section className="mt-16 bg-surface-container-low rounded-[1rem] overflow-hidden p-8 md:p-12 space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h2 className="font-headline text-4xl font-bold mb-2">
                Protection Analysis
              </h2>
              <p className="text-on-surface-variant text-lg">
                {results.comparisons.length} identity(ies) detected and
                analyzed.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="bg-primary text-on-primary px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                download
              </span>
              Download Protected Photo
            </button>
          </div>

          {/* Comparison Slider */}
          {results.tweaked_image_url && targetFile && (
            <ComparisonSlider
              originalUrl={getPreviewUrl(targetFile)}
              protectedUrl={results.tweaked_image_url}
            />
          )}

          {/* Similarity Scores */}
          <div className="space-y-6">
            <h3 className="font-headline text-2xl font-bold">
              Similarity Scores
            </h3>
            <p className="text-on-surface-variant text-sm -mt-4">
              Lower similarity = better protection against facial recognition.
            </p>

            {results.comparisons.map((comp, i) => (
              <div
                key={i}
                className="bg-surface-container-lowest p-6 rounded-[1rem] shadow-sm space-y-6"
              >
                <p className="font-bold text-lg">
                  vs. {comp.original_filename}
                </p>

                {/* Face images */}
                <div className="flex gap-4 items-start flex-wrap">
                  {comp.original_annotated_url && (
                    <div>
                      <p className="text-xs text-on-surface-variant mb-1">
                        Original (detected)
                      </p>
                      <img
                        src={comp.original_annotated_url}
                        alt="Original detected"
                        className="h-28 rounded-lg border border-outline-variant"
                      />
                    </div>
                  )}
                  {comp.original_face_url && (
                    <div>
                      <p className="text-xs text-on-surface-variant mb-1">
                        Original (extracted)
                      </p>
                      <img
                        src={comp.original_face_url}
                        alt="Original face"
                        className="h-28 rounded-lg border border-outline-variant"
                      />
                    </div>
                  )}
                  {comp.tweaked_face_url && (
                    <div>
                      <p className="text-xs text-on-surface-variant mb-1">
                        Tweaked (extracted)
                      </p>
                      <img
                        src={comp.tweaked_face_url}
                        alt="Tweaked face"
                        className="h-28 rounded-lg border border-outline-variant"
                      />
                    </div>
                  )}
                </div>

                {/* Score bars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">DeepFace</span>
                      <span
                        className={`font-bold ${similarityColor(comp.deepface.similarity)}`}
                      >
                        {(comp.deepface.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative h-3 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 ${similarityBarColor(comp.deepface.similarity)} rounded-full transition-all duration-500`}
                        style={{
                          width: `${Math.max(2, comp.deepface.similarity * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {comp.deepface.verified ? 'Match detected' : 'No match'}{' '}
                      ({comp.deepface.model})
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">InsightFace</span>
                      <span
                        className={`font-bold ${similarityColor(comp.insightface.similarity)}`}
                      >
                        {(comp.insightface.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative h-3 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 ${similarityBarColor(comp.insightface.similarity)} rounded-full transition-all duration-500`}
                        style={{
                          width: `${Math.max(2, comp.insightface.similarity * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

export default Tool
