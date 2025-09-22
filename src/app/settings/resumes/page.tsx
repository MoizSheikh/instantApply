'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/contexts/ToastContext'
import { Upload, FileText, Trash2, X, Plus, Download, Eye } from 'lucide-react'

interface Resume {
  filename: string
  displayName: string
  size: number
  uploadedAt: Date
}

export default function ResumesPage() {
  const toast = useToast()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resumes')
      const data = await response.json()
      setResumes(data || [])
    } catch (error) {
      console.error('Error fetching resumes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.warning('Invalid file type', 'Please select a PDF file')
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.warning('File too large', 'File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
      // Auto-fill display name from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      setDisplayName(nameWithoutExt)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile || !displayName) {
      toast.warning('Missing information', 'Please select a file and provide a display name')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('displayName', displayName)

      const response = await fetch('/api/resumes', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        await fetchResumes()
        resetForm()
        toast.success('Resume uploaded successfully!')
      } else {
        const error = await response.json()
        toast.error('Upload failed', error.error || 'Failed to upload resume')
      }
    } catch (error) {
      console.error('Error uploading resume:', error)
      toast.error('Upload failed', 'Failed to upload resume')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (filename: string) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return
    }

    try {
      const response = await fetch(`/api/resumes/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchResumes()
        toast.success('Resume deleted successfully!')
      } else {
        const error = await response.json()
        toast.error('Delete failed', error.error || 'Failed to delete resume')
      }
    } catch (error) {
      console.error('Error deleting resume:', error)
      toast.error('Delete failed', 'Failed to delete resume')
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setDisplayName('')
    setShowUploadForm(false)
    // Reset file input
    const fileInput = document.getElementById('resume-file') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resume Files</h1>
          <p className="text-gray-600 mt-2">
            Upload and manage your resume files for job applications
          </p>
        </div>
        <Button
          onClick={() => setShowUploadForm(true)}
          className="flex items-center"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Resume
        </Button>
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Upload Resume</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={resetForm}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select PDF File *
                </label>
                <input
                  id="resume-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">PDF files only, max 10MB</p>
              </div>

              <Input
                label="Display Name *"
                placeholder="e.g., Frontend Developer Resume"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Resume'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resumes List */}
      {resumes.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes uploaded</h3>
          <p className="text-gray-500 mb-4">Upload your first resume to get started</p>
          <Button onClick={() => setShowUploadForm(true)}>
            Upload Resume
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {resumes.map((resume) => (
            <div key={resume.filename} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{resume.displayName}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{resume.filename}</span>
                      <span>{formatFileSize(resume.size)}</span>
                      <span>Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/resumes/${resume.filename}`, '_blank')}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = `/resumes/${resume.filename}`
                      link.download = resume.filename
                      link.click()
                    }}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(resume.filename)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">Tips for Resume Management</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Create different versions for different roles (Frontend, Backend, Full Stack)</li>
          <li>• Use descriptive names to easily identify each resume</li>
          <li>• Keep file sizes under 10MB for better performance</li>
          <li>• Only PDF format is supported for compatibility</li>
        </ul>
      </div>
    </div>
  )
}
