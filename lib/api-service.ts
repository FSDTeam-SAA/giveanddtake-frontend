import axios from "axios";
import { getSession } from "next-auth/react";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

// API Functions
export interface User {
  _id: string;
  email: string;
}

export interface Company {
  _id: string;
  userId: string;
  clogo: string;
  aboutUs: string;
  cname: string;
  country: string;
  city: string;
  zipcode: string;
  cemail: string;
  cPhoneNumber: string;
  links: string[];
  industry: string;
  service: string[];
  employeesId: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Honor {
  _id: string;
  userId: string;
  title: string;
  programeName: string;
  programeDate: string;
  description: string;
}

export interface Job {
  _id: string;
  userId: string;
  companyId: string;
  title: string;
  description: string;
  salaryRange: string;
  location: string;
  shift: string;
  responsibilities: string[];
  educationExperience: string[];
  benefits: string[];
  vacancy: number;
  experience: number;
  deadline: string;
  status: string;
  compensation: string;
}

// Fetch all users for employee selection
export async function fetchUsers() {
  const response = await apiClient.get("/all/user");
  return response.data.data as User[];
}

// Fetch company details
export async function fetchCompanyDetails(userId: string) {
  const response = await apiClient.get(`/company/user/${userId}`);
  return response.data.data;
}

// Fetch company jobs
export async function fetchCompanyJobs() {
  const response = await apiClient.get("/jobs/recruiter/company");
  return response.data.data as Job[];
}

// Create company
export async function createCompany(formData: FormData) {
  const response = await apiClient.post("/company", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

// Upload elevator pitch video
export async function uploadElevatorPitch({
  videoFile,
  userId,
}: {
  videoFile: File;
  userId: string;
}) {
  const formData = new FormData();
  formData.append("videoFile", videoFile);

  const response = await apiClient.post(
    `/elevator-pitch/video?userId=${userId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

// Create Resume API
export async function createResume(data: FormData) {
  try {
    const response = await apiClient.post("/create-resume/create-resume", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    console.log("Resume creation successful: ", response)
    return response.data
  } catch (error) {
    console.error("Error in createResume API call:", error)
    throw error
  }
}



// Get my resume 
export async function getMyResume() {
  const res = await apiClient.get('/create-resume/get-resume')
  return res.data
}


// Get resume by user id
export async function getResumeByUserId(userId: string) {
  const res = await apiClient.get(`/applied-jobs/user/${userId}`)
  return res.data
}

// Get candidate applied jobs
export async function getAppliedJobs(userId: string) {
  const res = await apiClient.get(`/applied-jobs/user/${userId}`)
  return res.data
}


// Get recruiter account
export async function getRecruiterAccount(userId: string) {
  const res = await apiClient.get(`/recruiter/recruiter-account/${userId}`)
  return res.data
}


// Get recruiter jobs
export async function getRecruiterJobs() {
  const res = await apiClient.get(`/jobs/recruiter/company`)
  return res.data
}

// Get archived jobs
export async function getArchivedJobs() {
  const res = await apiClient.get(`/jobs/archived/user`)
  return res.data
}

// Update Archive Job Api
export async function updateArchiveJob(jobId: string, arcrivedJob: boolean) {
  const res = await apiClient.patch(`/jobs/${jobId}`, { arcrivedJob })
  return res.data
}

// Get applications by job id
export async function getApplicationsByJobId(jobId: string) {
  const res = await apiClient.get(`/applied-jobs/job/${jobId}`)
  return res.data
}

// Delete Job API
export async function deleteJob(jobId: string) {
  const res = await apiClient.delete(`/jobs/${jobId}`)
  return res.data
}


export default apiClient;