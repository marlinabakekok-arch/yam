'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, CheckCircle, Upload } from 'lucide-react'

interface ExtractionResult {
  folderName: string
  files: string[]
  message: string
}

export default function UploadZipPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.zip')) {
        setError('Please select a ZIP file')
        return
      }
      setFile(selectedFile)
      setError(null)
      setResult(null)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-zip', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload')
      }

      setResult(data)
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Upload & Extract ZIP</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Upload a ZIP file to automatically extract it
          </p>
        </div>

        {/* Upload Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select ZIP File</CardTitle>
            <CardDescription>
              Choose a ZIP archive to extract
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <Input
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                disabled={loading}
              />

              {file && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Selected: <span className="font-medium">{file.name}</span>
                </div>
              )}

              {error && (
                <div className="flex gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-950">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={!file || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Uploading & Extracting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Extract
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                Success
              </CardTitle>
              <CardDescription className="text-green-600 dark:text-green-300">
                {result.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                  Folder: <span className="font-mono text-xs">{result.folderName}</span>
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                  Extracted Files ({result.files.length}):
                </p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {result.files.map((file, idx) => (
                    <a
                      key={idx}
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-green-700 hover:text-green-600 dark:text-green-300 dark:hover:text-green-200 break-all"
                    >
                      📄 {file}
                    </a>
                  ))}
                </div>
              </div>

              <Button asChild variant="outline">
                <Link href="/">Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
