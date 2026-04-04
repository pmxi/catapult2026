import { useState, useRef } from 'react'

const API_URL = '/api'

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
  comparisons: ComparisonResult[]
}

function Home() {
  const [originalFiles, setOriginalFiles] = useState<File[]>([])
  const [targetFile, setTargetFile] = useState<File | null>(null)
  const [results, setResults] = useState<ProcessResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const originalInputRef = useRef<HTMLInputElement>(null)
  const targetInputRef = useRef<HTMLInputElement>(null)

  const handleOriginalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setOriginalFiles(Array.from(e.target.files))
    }
  }

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTargetFile(e.target.files[0])
    }
  }

  const handleProcess = async () => {
    if (!targetFile || originalFiles.length === 0) return

    setLoading(true)
    setResults(null)
    setError(null)

    try {
      const formData = new FormData()
      originalFiles.forEach((f) => formData.append('original_files', f))
      formData.append('target_file', targetFile)

      const res = await fetch(`${API_URL}/process`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Processing failed')
      }

      const data: ProcessResponse = await res.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const similarityColor = (score: number) => {
    if (score < 0.3) return 'text-green-400'
    if (score < 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

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
              className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
            >
              <input
                ref={originalInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleOriginalChange}
                className="hidden"
              />
              {originalFiles.length > 0 ? (
                <div>
                  <p className="text-green-400 font-medium">
                    {originalFiles.length} file(s) selected
                  </p>
                  <ul className="text-sm text-gray-500 mt-2">
                    {originalFiles.map((f, i) => (
                      <li key={i}>{f.name}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500">
                  Click to upload or drag and drop
                </p>
              )}
            </div>
          </div>

          {/* Target face upload */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Face to Tweak</h2>
            <p className="text-sm text-gray-500 mb-3">
              Upload the photo to protect with adversarial encoding.
            </p>
            <div
              onClick={() => targetInputRef.current?.click()}
              className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
            >
              <input
                ref={targetInputRef}
                type="file"
                accept="image/*"
                onChange={handleTargetChange}
                className="hidden"
              />
              {targetFile ? (
                <p className="text-green-400 font-medium">{targetFile.name}</p>
              ) : (
                <p className="text-gray-500">
                  Click to upload or drag and drop
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Process button */}
        <button
          onClick={handleProcess}
          disabled={loading || !targetFile || originalFiles.length === 0}
          className="w-full py-3 rounded-xl font-semibold text-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white text-black hover:bg-gray-200"
        >
          {loading ? 'Processing...' : 'Process'}
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
                  src={`${API_URL}${results.tweaked_image_url}`}
                  alt="Tweaked"
                  className="rounded-xl max-w-sm border border-gray-800"
                />
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
