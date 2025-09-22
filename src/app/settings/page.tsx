import Link from 'next/link'
import { Mail, FileText, Users, ArrowRight } from 'lucide-react'

const settingsCards = [
  {
    name: 'Templates',
    href: '/settings/templates',
    icon: Mail,
    description: 'Create and manage email templates for job applications',
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    name: 'Resumes',
    href: '/settings/resumes',
    icon: FileText,
    description: 'Upload and organize your resume files',
    color: 'bg-green-50 text-green-700 border-green-200'
  },
  {
    name: 'Roles',
    href: '/settings/roles',
    icon: Users,
    description: 'Configure role-based template and resume mappings',
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  }
]

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your application templates, resumes, and role configurations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.name}
              href={card.href}
              className="group relative bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200"
            >
              <div className={`inline-flex p-3 rounded-lg ${card.color} mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {card.name}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4">
                {card.description}
              </p>
              
              <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                Manage {card.name.toLowerCase()}
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Quick Setup Guide</h2>
        <div className="text-blue-800 space-y-2 text-sm">
          <p><strong>1. Templates:</strong> Create email templates for different types of applications</p>
          <p><strong>2. Resumes:</strong> Upload different versions of your resume (frontend, backend, etc.)</p>
          <p><strong>3. Roles:</strong> Map job roles to specific templates and resumes for auto-selection</p>
        </div>
      </div>
    </div>
  )
}
