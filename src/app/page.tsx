"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Job, JobStatus, Role, Template, RoleConfig } from "@/types";
import { formatDate, interpolateTemplate } from "@/lib/utils";
import { parseJobPost } from '@/lib/parse-job';
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, Send, Clock, CheckCircle, XCircle, Plus, X, Sparkles,
  TrendingUp, Users, Calendar, BarChart3, Building2, Activity
} from "lucide-react";

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

interface DashboardStats {
  totalJobs: number;
  recentApplications: number;
  statusStats: {
    draft: number;
    pending: number;
    sent: number;
    failed: number;
  };
  applicationsByCompany: Array<{
    company: string;
    count: number;
  }>;
  dailyApplications: Array<{
    date: string;
    count: number;
  }>;
}

const labelForField = (field: string) =>
  field === 'contactEmail' ? 'contact email' : field === 'jobTitle' ? 'job title' : 'company';

export default function DashboardPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sendingStates, setSendingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [bulkSending, setBulkSending] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showSendAllModal, setShowSendAllModal] = useState(false);
  const [showJobExtractor, setShowJobExtractor] = useState(false);
  const [roleConfigs, setRoleConfigs] = useState<RoleConfig[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [extractionLoading, setExtractionLoading] = useState(false);
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [quickAddData, setQuickAddData] = useState({
    jobTitle: '',
    role: '',
    contactEmail: '',
    companyName: '',
    templateId: '',
    resumeName: ''
  });

  useEffect(() => {
    fetchJobs();
    fetchRoleConfigs();
    fetchTemplates();
    fetchDashboardStats();
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

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get("/api/dashboard");
      setDashboardStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setDashboardStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const sendJob = async (jobId: string) => {
    setSendingStates((prev) => ({ ...prev, [jobId]: true }));

    try {
      const response = await axios.post("/api/send", { jobId });

      if (response.data.success) {
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId ? { ...job, status: "SENT" as JobStatus } : job
          )
        );
        toast({
          title: "Email sent successfully!",
          description: "Your job application has been sent.",
        });
        fetchDashboardStats();
      } else {
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId ? { ...job, status: "FAILED" as JobStatus } : job
          )
        );
        toast({
          variant: "destructive",
          title: "Failed to send email",
          description: response.data.message || "Please try again.",
        });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, status: "FAILED" as JobStatus } : job
        )
      );
      toast({
        variant: "destructive",
        title: "Network error",
        description: "Please try again.",
      });
    } finally {
      setSendingStates((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const sendAllPending = async () => {
    setBulkSending(true);
    setShowSendAllModal(false);

    try {
      const response = await axios.post("/api/send/bulk", { status: "PENDING" });

      await fetchJobs();
      fetchDashboardStats();

      toast({
        title: "Bulk send completed",
        description: response.data.message || "All pending applications have been sent.",
      });
    } catch (error) {
      console.error("Error in bulk send:", error);
      toast({
        variant: "destructive",
        title: "Network error",
        description: "Please try again.",
      });
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
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all required fields",
      });
      return;
    }

    setQuickAddLoading(true);

    try {
      await axios.post('/api/jobs', quickAddData);
      
      setQuickAddData({
        jobTitle: '',
        role: '',
        contactEmail: '',
        companyName: '',
        templateId: '',
        resumeName: ''
      });
      setShowQuickAdd(false);
      
      await fetchJobs();
      fetchDashboardStats();
      
      toast({
        title: "Job added successfully!",
        description: "Your job has been added to the dashboard.",
      });
    } catch (error: any) {
      console.error('Error creating job:', error);
      toast({
        variant: "destructive",
        title: "Failed to create job",
        description: error.response?.data?.error || "Please try again.",
      });
    } finally {
      setQuickAddLoading(false);
    }
  };

  const handleJobExtraction = () => {
    if (!jobDescriptionText.trim()) {
      toast({
        variant: "destructive",
        title: "Missing job description",
        description: "Please paste a job description",
      });
      return;
    }

    const parsed = parseJobPost(jobDescriptionText);
    const roleConfig = roleConfigs.find(config => config.role === parsed.role);

    setQuickAddData({
      jobTitle: parsed.jobTitle,
      role: parsed.role,
      contactEmail: parsed.contactEmail,
      companyName: parsed.companyName,
      templateId: roleConfig?.templateId || '',
      resumeName: roleConfig?.resumeName || ''
    });

    if (parsed.missing.length > 0) {
      toast({
        variant: "destructive",
        title: `Could not read: ${parsed.missing.map(labelForField).join(', ')}`,
        description: parsed.applyUrl
          ? "This post only links an application form — no email to send to."
          : "Fill the rest in by hand before sending.",
      });
    }

    setShowJobExtractor(false);
    setShowQuickAdd(true);
    setJobDescriptionText('');
  };

  const pendingCount = jobs?.filter((job) => job.status === "PENDING").length || 0;

  const getStatusCounts = () => {
    const counts = {
      all: jobs?.length || 0,
      DRAFT: jobs?.filter((job) => job.status === "DRAFT").length || 0,
      PENDING: pendingCount,
      SENT: jobs?.filter((job) => job.status === "SENT").length || 0,
      FAILED: jobs?.filter((job) => job.status === "FAILED").length || 0,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  const getPendingJobs = () => {
    return jobs?.filter((job) => job.status === "PENDING") || [];
  };

  if (loading || statsLoading) {
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
            {dashboardStats?.totalJobs || 0} total applications
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowJobExtractor(true)}
            variant="secondary"
            className="flex items-center"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Smart Extract
          </Button>
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
              onClick={() => setShowSendAllModal(true)}
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

      {/* Statistics Cards */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.totalJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Sent Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.statusStats.sent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Last 30 Days</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.recentApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.statusStats.pending}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {dashboardStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications by Company */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Building2 className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Top Companies</h3>
            </div>
            {dashboardStats.applicationsByCompany.length > 0 ? (
              <div className="space-y-3">
                {dashboardStats.applicationsByCompany.slice(0, 8).map((company, index) => (
                  <div key={company.company} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <span className="text-sm text-gray-900">{company.company}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((company.count / Math.max(...dashboardStats.applicationsByCompany.map(c => c.count))) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{company.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No company data available</p>
            )}
          </div>

          {/* Daily Applications Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Activity className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Last 7 Days</h3>
            </div>
            {dashboardStats.dailyApplications.length > 0 ? (
              <div className="space-y-3">
                {dashboardStats.dailyApplications.map((day) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${day.count > 0 ? Math.max((day.count / Math.max(...dashboardStats.dailyApplications.map(d => d.count))) * 100, 10) : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{day.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      )}

      {/* Status Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All Jobs', count: statusCounts.all },
            { key: 'DRAFT', label: 'Draft', count: statusCounts.DRAFT },
            { key: 'PENDING', label: 'Pending', count: statusCounts.PENDING },
            { key: 'SENT', label: 'Sent', count: statusCounts.SENT },
            { key: 'FAILED', label: 'Failed', count: statusCounts.FAILED },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                filter === tab.key
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
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

      {/* Job Extractor Modal */}
      {showJobExtractor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
                Smart Job Extraction
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowJobExtractor(false)}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> Paste a job description below and we&apos;ll automatically extract the job title, role, and contact email for you. The form will be pre-filled and ready to submit!
              </p>
            </div>

            <div className="space-y-4">
              <Textarea
                label="Job Description *"
                placeholder="Paste the complete job description here...

Example:
We are looking for a Senior Frontend Developer to join our team at TechCorp.

Requirements:
- 5+ years React experience
- Strong TypeScript skills
...

Contact: jobs@techcorp.com"
                rows={12}
                value={jobDescriptionText}
                onChange={(e) => setJobDescriptionText(e.target.value)}
              />

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowJobExtractor(false)}
                  disabled={extractionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleJobExtraction}
                  disabled={extractionLoading || !jobDescriptionText.trim()}
                  className="flex items-center"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {extractionLoading ? 'Extracting...' : 'Extract & Fill Form'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send All Modal */}
      {showSendAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Send All Pending Applications ({pendingCount})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSendAllModal(false)}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Review before sending:</strong> The following {pendingCount} job application{pendingCount !== 1 ? 's' : ''} will be sent automatically. Please review the details below.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              <div className="space-y-4">
                {getPendingJobs().map((job, index) => {
                  const emailPreview = getEmailPreview(job);
                  return (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {index + 1}. {job.jobTitle}
                          </h4>
                          <p className="text-sm text-gray-600">{job.role}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(new Date(job.createdAt))}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>To:</strong> {job.contactEmail}</p>
                          <p><strong>Resume:</strong> {job.resumeName}</p>
                          <p><strong>Template:</strong> {job.template?.name}</p>
                        </div>
                        <div>
                          {job.notes && (
                            <p><strong>Notes:</strong> {job.notes}</p>
                          )}
                        </div>
                      </div>

                      {emailPreview.subject && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="bg-gray-50 rounded-md p-3">
                            <div className="mb-2">
                              <span className="text-xs font-medium text-gray-500">Subject:</span>
                              <p className="text-sm text-gray-900">{emailPreview.subject}</p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500">Preview:</span>
                              <div className="text-sm text-gray-700 max-h-20 overflow-y-auto">
                                {emailPreview.body.substring(0, 200)}...
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowSendAllModal(false)}
                disabled={bulkSending}
              >
                Cancel
              </Button>
              <Button
                onClick={sendAllPending}
                disabled={bulkSending}
                className="flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                {bulkSending ? 'Sending All...' : `Send All ${pendingCount} Applications`}
              </Button>
            </div>
          </div>
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
