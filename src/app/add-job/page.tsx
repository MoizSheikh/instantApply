'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/contexts/ToastContext'
import { Role, Template, RoleConfig } from '@/types'

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

// Mock resume options - in a real app, you'd fetch these from the filesystem
const resumeOptions = [
  { value: 'resume-frontend.pdf', label: 'Frontend Resume' },
  { value: 'resume-backend.pdf', label: 'Backend Resume' },
  { value: 'resume-fullstack.pdf', label: 'Full Stack Resume' },
  { value: 'resume-general.pdf', label: 'General Resume' }
]

export default function AddJobPage() {
  const router = useRouter()
  const toast = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [roleConfigs, setRoleConfigs] = useState<RoleConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [quickApplyLoading, setQuickApplyLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState({
    jobTitle: '',
    role: '',
    contactEmail: '',
    notes: '',
    resumeName: '',
    templateId: ''
  })

  useEffect(() => {
    fetchTemplates()
    fetchRoleConfigs()
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

  const fetchRoleConfigs = async () => {
    try {
      const response = await axios.get('/api/role-configs')
      setRoleConfigs(response.data || [])
    } catch (error) {
      console.error('Error fetching role configs:', error)
      setRoleConfigs([])
    }
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
      // First create the job
      const createResponse = await axios.post('/api/jobs', formData)
      const jobId = createResponse.data.id

      // Then immediately send it
      const sendResponse = await axios.post('/api/send', { jobId })

      if (sendResponse.data.success) {
        toast.success('Job created and application sent successfully!')
        router.push('/')
      } else {
        toast.warning('Job created but failed to send', sendResponse.data.message)
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

    // Auto-select template and resume when role changes
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
              Fill in the job details and select a template for your application.
            </p>
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
