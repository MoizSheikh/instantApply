'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/contexts/ToastContext'
import { RoleConfig, Template, Role } from '@/types'
import { Plus, Edit, Trash2, X, Save, Users } from 'lucide-react'

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

const resumeOptions = [
  { value: 'resume-frontend.pdf', label: 'Frontend Resume' },
  { value: 'resume-backend.pdf', label: 'Backend Resume' },
  { value: 'resume-fullstack.pdf', label: 'Full Stack Resume' },
  { value: 'resume-general.pdf', label: 'General Resume' }
]

export default function RolesPage() {
  const toast = useToast()
  const [roleConfigs, setRoleConfigs] = useState<RoleConfig[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState<RoleConfig | null>(null)
  const [formData, setFormData] = useState({
    role: '',
    templateId: '',
    resumeName: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [roleConfigsResponse, templatesResponse] = await Promise.all([
        axios.get('/api/role-configs'),
        axios.get('/api/templates')
      ])
      setRoleConfigs(roleConfigsResponse.data || [])
      setTemplates(templatesResponse.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.role || !formData.templateId || !formData.resumeName) {
      toast.warning('Missing fields', 'Please fill in all fields')
      return
    }

    setSaving(true)

    try {
      if (editingConfig) {
        // Update existing role config
        await axios.put(`/api/role-configs/${editingConfig.id}`, formData)
      } else {
        // Create new role config
        await axios.post('/api/role-configs', formData)
      }

      await fetchData()
      resetForm()
      toast.success(editingConfig ? 'Role configuration updated successfully!' : 'Role configuration created successfully!')
    } catch (error: any) {
      console.error('Error saving role config:', error)
      toast.error('Failed to save role configuration', error.response?.data?.error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (config: RoleConfig) => {
    setEditingConfig(config)
    setFormData({
      role: config.role,
      templateId: config.templateId,
      resumeName: config.resumeName
    })
    setShowForm(true)
  }

  const handleDelete = async (config: RoleConfig) => {
    if (!window.confirm(`Are you sure you want to delete the configuration for "${config.role}"?`)) {
      return
    }

    try {
      await axios.delete(`/api/role-configs/${config.id}`)
      await fetchData()
      toast.success('Role configuration deleted successfully!')
    } catch (error: any) {
      console.error('Error deleting role config:', error)
      toast.error('Failed to delete role configuration', error.response?.data?.error)
    }
  }

  const resetForm = () => {
    setFormData({ role: '', templateId: '', resumeName: '' })
    setEditingConfig(null)
    setShowForm(false)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getAvailableRoles = () => {
    const usedRoles = roleConfigs.map(config => config.role)
    return roleOptions.filter(option => 
      !usedRoles.includes(option.value) || (editingConfig && editingConfig.role === option.value)
    )
  }

  const templateOptions = templates.map(template => ({
    value: template.id,
    label: template.name
  }))

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
          <h1 className="text-2xl font-bold text-gray-900">Role Configurations</h1>
          <p className="text-gray-600 mt-2">
            Configure which template and resume to use for each job role
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center"
          disabled={getAvailableRoles().length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Configuration
        </Button>
      </div>

      {/* Role Config Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingConfig ? 'Edit Role Configuration' : 'Create Role Configuration'}
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
              <Select
                label="Job Role *"
                options={getAvailableRoles()}
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
              />

              <Select
                label="Email Template *"
                options={templateOptions}
                value={formData.templateId}
                onChange={(e) => handleChange('templateId', e.target.value)}
              />

              <Select
                label="Resume File *"
                options={resumeOptions}
                value={formData.resumeName}
                onChange={(e) => handleChange('resumeName', e.target.value)}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Auto-Selection:</strong> When this role is selected, the specified template and resume will be automatically chosen.
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
                  {saving ? 'Saving...' : (editingConfig ? 'Update Configuration' : 'Create Configuration')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Configurations List */}
      {roleConfigs.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No role configurations yet</h3>
          <p className="text-gray-500 mb-4">Create your first role configuration to enable auto-selection</p>
          <Button onClick={() => setShowForm(true)}>
            Create Configuration
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roleConfigs.map((config) => (
            <div key={config.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-purple-50 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(config)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(config)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">{config.role}</h3>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Template:</span>
                  <p className="text-gray-900">{config.template?.name || 'Unknown'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Resume:</span>
                  <p className="text-gray-900">{config.resumeName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Created:</span>
                  <p className="text-gray-900">{new Date(config.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {getAvailableRoles().length === 0 && roleConfigs.length > 0 && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800 mb-2">All Roles Configured! 🎉</h3>
          <p className="text-sm text-green-700">
            You have configured all available job roles. Auto-selection will now work for all role types.
          </p>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">How Role Configurations Work</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• When creating a job, selecting a role will automatically choose the configured template and resume</li>
          <li>• This saves time and ensures consistency across applications</li>
          <li>• You can still manually change the auto-selected options if needed</li>
          <li>• Smart Extract feature also uses these configurations for auto-filling</li>
        </ul>
      </div>
    </div>
  )
}
