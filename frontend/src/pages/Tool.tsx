import { useState, useRef } from 'react'
import ProcessingAnimation from '../components/ProcessingAnimation'
import ComparisonSlider from '../components/ComparisonSlider'

interface ScorePair {
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

interface ProtectedResult {
  original_filename: string
  original_url: string
  tweaked_image_url: string
  download_name: string
  original_annotated_url: string | null
  original_face_url: string | null
  tweaked_annotated_url: string | null
  tweaked_face_url: string | null
  protection: ScorePair
}

interface ReferenceComparison {
  reference_filename: string
  reference_annotated_url: string | null
  reference_face_url: string | null
  comparisons: {
    tweaked_filename: string
    deepface: ScorePair['deepface']
    insightface: ScorePair['insightface']
  }[]
}

interface ProcessResponse {
  protected: ProtectedResult[]
  reference_comparisons: ReferenceComparison[]
}

function Tool() {
  const [originalFiles, setOriginalFiles] = useState<File[]>([])
  const [referenceFiles, setReferenceFiles] = useState<File[]>([])
  const [results, setResults] = useState<ProcessResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const originalInputRef = useRef<HTMLInputElement>(null)
  const referenceInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleOriginalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setOriginalFiles((prev) => [...prev, ...newFiles])
    }
    e.target.value = ''
  }

  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setReferenceFiles((prev) => [...prev, ...newFiles])
    }
    e.target.value = ''
  }

  const removeOriginal = (index: number) => {
    setOriginalFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeReference = (index: number) => {
    setReferenceFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleProcess = async () => {
    if (originalFiles.length === 0) return

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
      referenceFiles.forEach((f) => formData.append('reference_files', f))

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/process`,
        {
          method: 'POST',
          body: formData,
        }
      )

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

  const handleDownload = async (tweakedUrl: string, downloadName: string) => {
    const urlPrefix = tweakedUrl.startsWith('http')
      ? ''
      : import.meta.env.VITE_API_URL || ''
    const res = await fetch(`${urlPrefix}${tweakedUrl}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName
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

  const ScoreBar = ({
    label,
    score,
    subtitle,
  }: {
    label: string
    score: number
    subtitle?: string
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-bold">{label}</span>
        <span className={`font-bold ${similarityColor(score)}`}>
          {(score * 100).toFixed(1)}%
        </span>
      </div>
      <div className="relative h-3 bg-surface-container rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${similarityBarColor(score)} rounded-full transition-all duration-500`}
          style={{ width: `${Math.max(2, score * 100)}%` }}
        />
      </div>
      {subtitle && (
        <p className="text-xs text-on-surface-variant">{subtitle}</p>
      )}
    </div>
  )

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

      {/* Upload Sections */}
      <section className="space-y-10 mb-12">
        {/* Original Images */}
        <div>
          <div className="flex items-center space-x-4 mb-4">
            <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
              1
            </span>
            <h2 className="font-headline text-2xl font-bold">
              Original Images
            </h2>
          </div>
          <p className="text-sm text-on-surface-variant mb-3">
            Upload the photos you want to protect. Each will be processed with
            adversarial encoding.
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
            <div className="mt-4 grid grid-cols-4 gap-3">
              {originalFiles.map((f, i) => (
                <div key={i} className="relative group">
                  <img
                    src={getPreviewUrl(f)}
                    alt={f.name}
                    className={`w-full h-24 object-cover rounded-lg border ${loading ? 'border-green-500/50' : 'border-outline-variant'}`}
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
                      onClick={() => removeOriginal(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      X
                    </button>
                  )}
                  <p className="text-xs text-on-surface-variant mt-1 truncate">
                    {f.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reference Images */}
        <div>
          <div className="flex items-center space-x-4 mb-4">
            <span className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm">
              2
            </span>
            <h2 className="font-headline text-2xl font-bold">
              Reference Images for Testing
            </h2>
            <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
              Optional
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mb-3">
            Upload different photos of the same person to test if facial
            recognition can still match them against the protected images.
          </p>
          <div
            onClick={() => referenceInputRef.current?.click()}
            className="border-2 border-dashed border-outline-variant rounded-[1rem] p-6 text-center cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-all"
          >
            <input
              ref={referenceInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleReferenceChange}
              className="hidden"
            />
            <span
              className="material-symbols-outlined text-secondary text-3xl mb-1 block"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
            >
              compare
            </span>
            <p className="text-on-surface-variant text-sm">
              Click to upload reference images
            </p>
          </div>
          {referenceFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {referenceFiles.map((f, i) => (
                <div key={i} className="relative group">
                  <img
                    src={getPreviewUrl(f)}
                    alt={f.name}
                    className="w-full h-24 object-cover rounded-lg border border-outline-variant"
                  />
                  <button
                    onClick={() => removeReference(i)}
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
      </section>

      {/* Process Button */}
      <button
        onClick={handleProcess}
        disabled={loading || originalFiles.length === 0}
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
      {loading && originalFiles.length > 0 && (
        <ProcessingAnimation
          originalFiles={originalFiles}
          targetFile={originalFiles[0]}
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
        <div className="mt-16 space-y-16">
          {/* Protection Analysis */}
          <section className="bg-surface-container-low rounded-[1rem] overflow-hidden p-8 md:p-12 space-y-10">
            <div>
              <h2 className="font-headline text-4xl font-bold mb-2">
                Protection Analysis
              </h2>
              <p className="text-on-surface-variant text-lg">
                Comparing original vs. protected — lower similarity means
                stronger protection.
              </p>
            </div>

            {results.protected.map((pr, i) => (
              <div
                key={i}
                className="space-y-6 pb-8 border-b border-outline-variant/20 last:border-0 last:pb-0"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h3 className="font-headline text-xl font-bold">
                    {pr.original_filename}
                  </h3>
                  <button
                    onClick={() =>
                      handleDownload(pr.tweaked_image_url, pr.download_name)
                    }
                    className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity text-sm"
                  >
                    <span
                      className="material-symbols-outlined text-lg"
                      style={{
                        fontVariationSettings: "'FILL' 0, 'wght' 400",
                      }}
                    >
                      download
                    </span>
                    Download {pr.download_name}
                  </button>
                </div>

                {/* Slider + Scores side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <ComparisonSlider
                      originalUrl={`${import.meta.env.VITE_API_URL || ''}${pr.original_url}`}
                      protectedUrl={`${import.meta.env.VITE_API_URL || ''}${pr.tweaked_image_url}`}
                    />
                  </div>
                  <div className="flex flex-col justify-center space-y-6">
                    <ScoreBar
                      label="DeepFace"
                      score={pr.protection.deepface.similarity}
                      subtitle={`${pr.protection.deepface.verified ? 'Match detected' : 'No match'} (${pr.protection.deepface.model})`}
                    />
                    <ScoreBar
                      label="InsightFace"
                      score={pr.protection.insightface.similarity}
                    />

                    {/* Face crops */}
                    <div className="flex gap-3 mt-2">
                      {pr.original_face_url && (
                        <div>
                          <p className="text-xs text-on-surface-variant mb-1">
                            Original
                          </p>
                          <img
                            src={`${import.meta.env.VITE_API_URL || ''}${pr.original_face_url}`}
                            alt="Original face"
                            className="h-20 rounded-lg border border-outline-variant"
                          />
                        </div>
                      )}
                      {pr.tweaked_face_url && (
                        <div>
                          <p className="text-xs text-on-surface-variant mb-1">
                            Protected
                          </p>
                          <img
                            src={`${import.meta.env.VITE_API_URL || ''}${pr.tweaked_face_url}`}
                            alt="Tweaked face"
                            className="h-20 rounded-lg border border-outline-variant"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Reference Comparisons */}
          {results.reference_comparisons.length > 0 && (
            <section className="bg-surface-container-low rounded-[1rem] overflow-hidden p-8 md:p-12 space-y-8">
              <div>
                <h2 className="font-headline text-4xl font-bold mb-2">
                  Similarity Scores
                </h2>
                <p className="text-on-surface-variant text-lg">
                  Testing reference images against protected images — lower
                  means the AI can&rsquo;t match them.
                </p>
              </div>

              {results.reference_comparisons.map((ref, i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest p-6 rounded-[1rem] shadow-sm space-y-6"
                >
                  <div className="flex items-center gap-4">
                    {ref.reference_face_url && (
                      <img
                        src={`${import.meta.env.VITE_API_URL || ''}${ref.reference_face_url}`}
                        alt="Reference face"
                        className="h-16 w-16 object-cover rounded-lg border border-outline-variant"
                      />
                    )}
                    <div>
                      <p className="font-bold text-lg">
                        {ref.reference_filename}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Reference image
                      </p>
                    </div>
                  </div>

                  {ref.comparisons.map((comp, j) => (
                    <div
                      key={j}
                      className="pl-4 border-l-2 border-outline-variant/30 space-y-4"
                    >
                      <p className="text-sm font-medium text-on-surface-variant">
                        vs. protected{' '}
                        <span className="text-on-surface">
                          {comp.tweaked_filename}
                        </span>
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ScoreBar
                          label="DeepFace"
                          score={comp.deepface.similarity}
                          subtitle={`${comp.deepface.verified ? 'Match detected' : 'No match'} (${comp.deepface.model})`}
                        />
                        <ScoreBar
                          label="InsightFace"
                          score={comp.insightface.similarity}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </main>
  )
}

export default Tool
