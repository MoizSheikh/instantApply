'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/hooks/use-toast'
import { Role, Template, RoleConfig } from '@/types'
import { parseJobPost, ParsedJob } from '@/lib/parse-job'

const roleOptions: { value: Role; label: string }[] = [
  { value: 'Frontend Developer', label: 'Frontend Developer' },
  { value: 'Backend Developer', label: 'Backend Developer' },
  { value: 'Full Stack Developer', label: 'Full Stack Developer' },
  { value: 'Software Engineer', label: 'Software Engineer' },
  { value: 'DevOps Engineer', label: 'DevOps Engineer' },
  { value: 'Data Scientist', label: 'Data Scientist' },
  { value: 'Product Manager', label: 'Product Manager' },
  { value: 'UI/UX Designer', label: 'UI/UX Designer' },
  { value: 'QA Engineer', label: 'QA Engineer' },
  { value: 'Other', label: 'Other' }
]

export default function AddJobPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [resumeOptions, setResumeOptions] = useState<{ value: string; label: string }[]>([])
  const [roleConfigs, setRoleConfigs] = useState<RoleConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [quickApplyLoading, setQuickApplyLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [paste, setPaste] = useState('')
  const [parsed, setParsed] = useState<ParsedJob | null>(null)

  const [formData, setFormData] = useState({
    jobTitle: '',
    role: '',
    contactEmail: '',
    companyName: '',
    notes: '',
    resumeName: '',
    templateId: ''
  })

  useEffect(() => {
    fetchTemplates()
    fetchRoleConfigs()
    fetchResumes()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/templates')
      setTemplates(response.data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      setTemplates([])
    }
  }

  const fetchResumes = async () => {
    try {
      const response = await axios.get('/api/resumes')
      setResumeOptions((response.data || []).map((r: { filename: string; displayName: string }) => ({
        value: r.filename,
        label: r.displayName
      })))
    } catch (error) {
      console.error('Error fetching resumes:', error)
      setResumeOptions([])
    }
  }

  const fetchRoleConfigs = async () => {
    try {
      const response = await axios.get('/api/role-configs')
      setRoleConfigs(response.data || [])
    } catch (error) {
      console.error('Error fetching role configs:', error)
      setRoleConfigs([])
    }
  }

  const applyParse = (text: string) => {
    setPaste(text)
    if (!text.trim()) {
      setParsed(null)
      return
    }
    const p = parseJobPost(text)
    setParsed(p)
    const roleConfig = roleConfigs.find(c => c.role === p.role)
    setFormData(prev => ({
      ...prev,
      jobTitle: p.jobTitle || prev.jobTitle,
      role: p.role || prev.role,
      contactEmail: p.contactEmail || prev.contactEmail,
      companyName: p.companyName || prev.companyName,
      notes: [p.applyUrl && `Apply: ${p.applyUrl}`, text.trim()].filter(Boolean).join('\n\n'),
      templateId: roleConfig ? roleConfig.templateId : prev.templateId,
      resumeName: roleConfig ? roleConfig.resumeName : prev.resumeName
    }))
    setErrors({})
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required'
    }

    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address'
    }

    if (!formData.resumeName) {
      newErrors.resumeName = 'Resume is required'
    }

    if (!formData.templateId) {
      newErrors.templateId = 'Template is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      await axios.post('/api/jobs', formData)
      router.push('/')
    } catch (error: any) {
      console.error('Error creating job:', error)
      const errorMessage = error.response?.data?.error || 'Failed to create job'
      setErrors({ submit: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickApply = async () => {
    if (!validateForm()) {
      return
    }

    setQuickApplyLoading(true)

    try {
      const createResponse = await axios.post('/api/jobs', formData)
      const jobId = createResponse.data.id

      const sendResponse = await axios.post('/api/send', { jobId })

      if (sendResponse.data.success) {
        toast({
          title: "Job created and application sent successfully!",
          description: "Your application has been submitted.",
        })
        router.push('/')
      } else {
        toast({
          title: "Job created but failed to send",
          description: sendResponse.data.message || "You can try sending it later from the dashboard.",
        })
        router.push('/')
      }
    } catch (error: any) {
      console.error('Error in quick apply:', error)
      const errorMessage = error.response?.data?.error || 'Failed to create and send job'
      setErrors({ submit: errorMessage })
    } finally {
      setQuickApplyLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    if (field === 'role' && value) {
      const roleConfig = roleConfigs.find(config => config.role === value)
      if (roleConfig) {
        setFormData(prev => ({
          ...prev,
          [field]: value,
          templateId: roleConfig.templateId,
          resumeName: roleConfig.resumeName
        }))
      }
    }
  }

  const templateOptions = (templates || []).map(template => ({
    value: template.id,
    label: template.name
  }))

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900">Add New Job Application</h2>
            <p className="mt-1 text-sm text-gray-500">
              Paste the LinkedIn post below and the fields fill themselves.
            </p>
          </div>

          <div className="mb-6 space-y-3">
            <Textarea
              label="Paste job post"
              placeholder="Paste the whole LinkedIn post here..."
              rows={6}
              value={paste}
              onChange={(e) => applyParse(e.target.value)}
            />

            {parsed && parsed.missing.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <p className="text-sm font-medium text-amber-800">
                  Could not find: {parsed.missing.map(m => m === 'contactEmail' ? 'contact email' : m === 'jobTitle' ? 'job title' : 'company').join(', ')}
                </p>
                {parsed.missing.includes('contactEmail') && (
                  <p className="mt-1 text-sm text-amber-700">
                    {parsed.applyUrl
                      ? 'No email in this post — it only links an application form, so this one has to be done in the browser.'
                      : 'No email in this post. Find one on the company site or skip it.'}
                  </p>
                )}
                {parsed.applyUrl && (
                  <a href={parsed.applyUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-amber-900 underline">
                    Open application form
                  </a>
                )}
              </div>
            )}

            {parsed && parsed.missing.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">
                  Parsed {parsed.jobTitle} at {parsed.companyName} — {parsed.contactEmail}
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Job Title *"
              placeholder="e.g., Senior Frontend Developer"
              value={formData.jobTitle}
              onChange={(e) => handleChange('jobTitle', e.target.value)}
              error={errors.jobTitle}
            />

            <Select
              label="Role *"
              options={roleOptions}
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              error={errors.role}
            />

            <Input
              label="Contact Email *"
              type="email"
              placeholder="hiring@company.com"
              value={formData.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              error={errors.contactEmail}
            />

            <Input
              label="Company"
              placeholder="e.g., Vercel"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
            />

            <Textarea
              label="Notes"
              placeholder="Additional notes about the position, company, or application..."
              rows={4}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />

            <Select
              label="Resume *"
              options={resumeOptions}
              value={formData.resumeName}
              onChange={(e) => handleChange('resumeName', e.target.value)}
              error={errors.resumeName}
            />

            <Select
              label="Email Template *"
              options={templateOptions}
              value={formData.templateId}
              onChange={(e) => handleChange('templateId', e.target.value)}
              error={errors.templateId}
            />

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/')}
                disabled={loading || quickApplyLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="secondary"
                disabled={loading || quickApplyLoading}
              >
                {loading ? 'Creating...' : 'Create Job'}
              </Button>
              <Button
                type="button"
                onClick={handleQuickApply}
                disabled={loading || quickApplyLoading}
              >
                {quickApplyLoading ? 'Applying...' : 'Quick Apply'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
