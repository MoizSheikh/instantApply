'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/contexts/ToastContext'
import { Template } from '@/types'
import { Plus, Edit, Trash2, X, Save } from 'lucide-react'

export default function TemplatesPage() {
  const toast = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/templates')
      setTemplates(response.data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.subject || !formData.body) {
      toast.warning('Missing fields', 'Please fill in all fields')
      return
    }

    setSaving(true)

    try {
      if (editingTemplate) {
        // Update existing template
        await axios.put(`/api/templates/${editingTemplate.id}`, formData)
      } else {
        // Create new template
        await axios.post('/api/templates', formData)
      }

      await fetchTemplates()
      resetForm()
      toast.success(editingTemplate ? 'Template updated successfully!' : 'Template created successfully!')
    } catch (error: any) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template', error.response?.data?.error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body
    })
    setShowForm(true)
  }

  const handleDelete = async (template: Template) => {
    if (!window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return
    }

    try {
      await axios.delete(`/api/templates/${template.id}`)
      await fetchTemplates()
      toast.success('Template deleted successfully!')
    } catch (error: any) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template', error.response?.data?.error)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', subject: '', body: '' })
    setEditingTemplate(null)
    setShowForm(false)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-2">
            Create and manage email templates for your job applications
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={resetForm}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Template Name *"
                placeholder="e.g., Professional Standard"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />

              <Input
                label="Email Subject *"
                placeholder="e.g., Application for {{jobTitle}} Position"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
              />

              <Textarea
                label="Email Body *"
                placeholder="Write your email template here. You can use variables like {{jobTitle}}, {{company}}, {{role}}, and {{notes}}"
                rows={12}
                value={formData.body}
                onChange={(e) => handleChange('body', e.target.value)}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Available Variables:</strong> {`{{jobTitle}}, {{company}}, {{role}}, {{notes}}`}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : (editingTemplate ? 'Update Template' : 'Create Template')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-500 mb-4">Create your first email template to get started</p>
          <Button onClick={() => setShowForm(true)}>
            Create Template
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {templates.map((template) => (
            <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500">
                    Created {new Date(template.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-gray-500">Subject:</span>
                  <p className="text-sm text-gray-900">{template.subject}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Body Preview:</span>
                  <div className="text-sm text-gray-700 bg-gray-50 rounded p-2 max-h-20 overflow-y-auto">
                    {template.body.substring(0, 150)}...
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
