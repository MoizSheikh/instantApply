"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Job, JobStatus, Role, Template, RoleConfig } from "@/types";
import { formatDate, interpolateTemplate } from "@/lib/utils";
import { Mail, Send, Clock, CheckCircle, XCircle, Filter, Plus, X } from "lucide-react";

const statusConfig = {
  DRAFT: { label: "Draft", icon: Clock, color: "text-gray-500 bg-gray-100" },
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "text-yellow-600 bg-yellow-100",
  },
  SENT: {
    label: "Sent",
    icon: CheckCircle,
    color: "text-green-600 bg-green-100",
  },
  FAILED: { label: "Failed", icon: XCircle, color: "text-red-600 bg-red-100" },
};

const filterOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Jobs" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending" },
  { value: "SENT", label: "Sent" },
  { value: "FAILED", label: "Failed" },
];

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

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sendingStates, setSendingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [bulkSending, setBulkSending] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [roleConfigs, setRoleConfigs] = useState<RoleConfig[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    jobTitle: '',
    role: '',
    contactEmail: '',
    templateId: '',
    resumeName: ''
  });

  useEffect(() => {
    fetchJobs();
    fetchRoleConfigs();
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (filter === "all") {
      setFilteredJobs(jobs);
    } else {
      setFilteredJobs(jobs.filter((job) => job.status === filter));
    }
  }, [jobs, filter]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get("/api/jobs");
      setJobs(response.data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      // Don't set jobs on error - keep existing state or empty array
      if (jobs.length === 0) {
        setJobs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleConfigs = async () => {
    try {
      const response = await axios.get("/api/role-configs");
      setRoleConfigs(response.data || []);
    } catch (error) {
      console.error("Error fetching role configs:", error);
      setRoleConfigs([]);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get("/api/templates");
      setTemplates(response.data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      setTemplates([]);
    }
  };

  const sendJob = async (jobId: string) => {
    setSendingStates((prev) => ({ ...prev, [jobId]: true }));

    try {
      const response = await axios.post("/api/send", { jobId });

      if (response.data.success) {
        // Update the job in the local state
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId ? { ...job, status: "SENT" as JobStatus } : job
          )
        );
        alert("Email sent successfully!");
      } else {
        // Update to failed status
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId ? { ...job, status: "FAILED" as JobStatus } : job
          )
        );
        alert(response.data.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      // Update to failed status on error
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, status: "FAILED" as JobStatus } : job
        )
      );
      alert("Network error. Please try again.");
    } finally {
      setSendingStates((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const sendAllPending = async () => {
    setBulkSending(true);

    try {
      const response = await axios.post("/api/send/bulk", { status: "PENDING" });

      // Refresh jobs to get updated statuses
      await fetchJobs();

      alert(response.data.message || "Bulk send completed");
    } catch (error) {
      console.error("Error in bulk send:", error);
      alert("Network error. Please try again.");
    } finally {
      setBulkSending(false);
    }
  };

  const getEmailPreview = (job: Job) => {
    if (!job.template) return { subject: "", body: "" };
    return interpolateTemplate(job.template, job);
  };

  const handleQuickAddChange = (field: string, value: string) => {
    setQuickAddData(prev => ({ ...prev, [field]: value }));

    // Auto-select template and resume when role changes
    if (field === 'role' && value) {
      const roleConfig = roleConfigs.find(config => config.role === value);
      if (roleConfig) {
        setQuickAddData(prev => ({
          ...prev,
          [field]: value,
          templateId: roleConfig.templateId,
          resumeName: roleConfig.resumeName
        }));
      }
    }
  };

  const handleQuickAddSubmit = async () => {
    if (!quickAddData.jobTitle || !quickAddData.role || !quickAddData.contactEmail) {
      alert('Please fill in all required fields');
      return;
    }

    setQuickAddLoading(true);

    try {
      await axios.post('/api/jobs', quickAddData);
      
      // Reset form and close modal
      setQuickAddData({
        jobTitle: '',
        role: '',
        contactEmail: '',
        templateId: '',
        resumeName: ''
      });
      setShowQuickAdd(false);
      
      // Refresh jobs list
      await fetchJobs();
      
      alert('Job added successfully!');
    } catch (error: any) {
      console.error('Error creating job:', error);
      alert(error.response?.data?.error || 'Failed to create job');
    } finally {
      setQuickAddLoading(false);
    }
  };

  const pendingCount = jobs?.filter((job) => job.status === "PENDING").length || 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Job Applications Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {jobs?.length || 0} total applications
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowQuickAdd(true)}
            variant="secondary"
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Quick Add
          </Button>
          {pendingCount > 0 && (
            <Button
              onClick={sendAllPending}
              disabled={bulkSending}
              className="flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              {bulkSending
                ? "Sending..."
                : `Send All Pending (${pendingCount})`}
            </Button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-4">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          {filteredJobs?.length || 0} result{(filteredJobs?.length || 0) !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Jobs List */}
      {(filteredJobs?.length || 0) === 0 ? (
        <div className="text-center py-12">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === "all"
              ? "No jobs yet"
              : `No ${filter.toLowerCase()} jobs`}
          </h3>
          <p className="text-gray-500">
            {filter === "all"
              ? "Start by adding your first job application."
              : "Try changing the filter to see more results."}
          </p>
        </div>
        ) : (
        <div className="grid gap-6">
          {(filteredJobs || []).map((job) => {
            const StatusIcon = statusConfig[job.status].icon;
            const emailPreview = getEmailPreview(job);
            const isSending = sendingStates[job.id];

            return (
              <div
                key={job.id}
                className="bg-white shadow rounded-lg overflow-hidden"
              >
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {job.jobTitle}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusConfig[job.status].color
                          }`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[job.status].label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p>
                            <strong>Role:</strong> {job.role}
                          </p>
                          <p>
                            <strong>Contact:</strong> {job.contactEmail}
                          </p>
                          <p>
                            <strong>Resume:</strong> {job.resumeName}
                          </p>
                          <p>
                            <strong>Template:</strong> {job.template?.name}
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Created:</strong>{" "}
                            {formatDate(new Date(job.createdAt))}
                          </p>
                          {job.notes && (
                            <p>
                              <strong>Notes:</strong> {job.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex-shrink-0">
                      {(job.status === "DRAFT" || job.status === "FAILED") && (
                        <Button
                          size="sm"
                          onClick={() => sendJob(job.id)}
                          disabled={isSending}
                          className="flex items-center"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          {isSending ? "Sending..." : "Send"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Email Preview */}
                  {emailPreview.subject && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Email Preview:
                      </h4>
                      <div className="bg-gray-50 rounded-md p-3 space-y-2">
                        <div>
                          <span className="text-xs font-medium text-gray-500">
                            Subject:
                          </span>
                          <p className="text-sm text-gray-900">
                            {emailPreview.subject}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500">
                            Body:
                          </span>
                          <div
                            className="text-sm text-gray-700 max-h-32 overflow-y-auto"
                            dangerouslySetInnerHTML={{
                              __html: emailPreview.body.replace(/\n/g, "<br>"),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Quick Add Job</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuickAdd(false)}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <Input
                label="Job Title *"
                placeholder="e.g., Senior Frontend Developer"
                value={quickAddData.jobTitle}
                onChange={(e) => handleQuickAddChange('jobTitle', e.target.value)}
              />

              <Select
                label="Role *"
                options={roleOptions}
                value={quickAddData.role}
                onChange={(e) => handleQuickAddChange('role', e.target.value)}
              />

              <Input
                label="Contact Email *"
                type="email"
                placeholder="hiring@company.com"
                value={quickAddData.contactEmail}
                onChange={(e) => handleQuickAddChange('contactEmail', e.target.value)}
              />

              {quickAddData.templateId && (
                <div className="text-sm text-gray-600">
                  <p><strong>Auto-selected Template:</strong> {templates.find(t => t.id === quickAddData.templateId)?.name}</p>
                  <p><strong>Auto-selected Resume:</strong> {quickAddData.resumeName}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowQuickAdd(false)}
                  disabled={quickAddLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleQuickAddSubmit}
                  disabled={quickAddLoading}
                >
                  {quickAddLoading ? 'Adding...' : 'Add Job'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
