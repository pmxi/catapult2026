import { useState, useRef } from 'react'

interface ComparisonResult {
  original_filename: string
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
  download_name: string
  comparisons: ComparisonResult[]
}

function Home() {
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

  const similarityColor = (score: number) => {
    if (score < 0.3) return 'text-green-400'
    if (score < 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getPreviewUrl = (file: File) => URL.createObjectURL(file)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">VIE</h1>
        <p className="text-gray-400 mb-10">
          Visual Identity Encoder — Poison your photos before they poison your
          privacy.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Original faces upload */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Original Face(s)</h2>
            <p className="text-sm text-gray-500 mb-3">
              Upload reference photos for comparison.
            </p>
            <div
              onClick={() => originalInputRef.current?.click()}
              className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-gray-500 transition-colors"
            >
              <input
                ref={originalInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleOriginalChange}
                className="hidden"
              />
              <p className="text-gray-500">Click to upload or drag and drop</p>
            </div>
            {originalFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {originalFiles.map((f, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={getPreviewUrl(f)}
                      alt={f.name}
                      className="w-full h-24 object-cover rounded-lg border border-gray-800"
                    />
                    <button
                      onClick={() => removeOriginal(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      X
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {f.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Target face upload */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Face to Tweak</h2>
            <p className="text-sm text-gray-500 mb-3">
              Upload the photo to protect with adversarial encoding.
            </p>
            {targetFile ? (
              <div className="relative group">
                <img
                  src={getPreviewUrl(targetFile)}
                  alt={targetFile.name}
                  className="w-full max-h-48 object-cover rounded-xl border border-gray-800"
                />
                <button
                  onClick={removeTarget}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  X
                </button>
                <p className="text-xs text-gray-500 mt-2 truncate">
                  {targetFile.name}
                </p>
              </div>
            ) : (
              <div
                onClick={() => targetInputRef.current?.click()}
                className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-gray-500 transition-colors"
              >
                <input
                  ref={targetInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleTargetChange}
                  className="hidden"
                />
                <p className="text-gray-500">Click to upload or drag and drop</p>
              </div>
            )}
          </div>
        </div>

        {/* Process button */}
        <button
          onClick={handleProcess}
          disabled={loading || !targetFile || originalFiles.length === 0}
          className="w-full py-3 rounded-xl font-semibold text-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white text-black hover:bg-gray-200"
        >
          {loading
            ? `Processing... (${elapsed ?? 0}s)`
            : elapsed !== null
              ? `Processed (${elapsed}s)`
              : 'Process'}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-6">Results</h2>

            {/* Tweaked image */}
            {results.tweaked_image_url && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3">Tweaked Image</h3>
                <img
                  src={results.tweaked_image_url}
                  alt="Tweaked"
                  className="rounded-xl max-w-sm border border-gray-800"
                />
                <button
                  onClick={handleDownload}
                  className="mt-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Download {results.download_name}
                </button>
              </div>
            )}

            {/* Comparison scores */}
            <h3 className="text-lg font-semibold mb-4">
              Similarity Scores (lower = better protection)
            </h3>
            <div className="space-y-4">
              {results.comparisons.map((comp, i) => (
                <div
                  key={i}
                  className="bg-gray-900 rounded-xl p-5 border border-gray-800"
                >
                  <p className="font-medium mb-3">
                    vs. {comp.original_filename}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">DeepFace</p>
                      <p
                        className={`text-2xl font-bold ${similarityColor(comp.deepface.similarity)}`}
                      >
                        {(comp.deepface.similarity * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {comp.deepface.verified
                          ? 'Match detected'
                          : 'No match'}{' '}
                        ({comp.deepface.model})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">InsightFace</p>
                      <p
                        className={`text-2xl font-bold ${similarityColor(comp.insightface.similarity)}`}
                      >
                        {(comp.insightface.similarity * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
