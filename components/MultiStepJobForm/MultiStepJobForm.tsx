'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Info, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import TextEditor from './TextEditor';
import JobPreview from './JobPreview';
import CustomCalendar from './CustomCalendar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ApplicationRequirement {
  id: string;
  label: string;
  required: boolean;
}

interface CustomQuestion {
  id: string;
  question: string;
}

interface JobCategory {
  _id: string;
  name: string;
  categoryIcon: string;
}

interface FormData {
  jobTitle: string;
  department: string;
  country: string;
  region: string;
  employmentType: string;
  experience: string;
  category: string;
  categoryId: string;
  compensation: string;
  expirationDate: string;
  companyUrl: string;
  jobDescription: string;
  publishDate: string;
}

async function fetchJobCategories() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/category/job-category`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch job categories');
  }
  return response.json();
}

async function postJob(data: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to publish job');
  }

  return response.json();
}

export default function MultiStepJobForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const companyId = "687b65e9153a2f59d4b57ba8";
  const session = useSession();
  const userId = session.data?.user?.id;
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    jobTitle: '',
    department: '',
    country: '',
    region: '',
    employmentType: '',
    experience: '',
    category: '',
    categoryId: '',
    compensation: '',
    expirationDate: '',
    companyUrl: '',
    jobDescription: ``,
    publishDate: '',
  });

  const [applicationRequirements, setApplicationRequirements] = useState<ApplicationRequirement[]>([
    { id: 'address', label: 'Address', required: false },
    { id: 'resume', label: 'Resume', required: true },
    { id: 'coverLetter', label: 'Cover Letter', required: true },
    { id: 'reference', label: 'Reference', required: true },
    { id: 'website', label: 'Website', required: true },
    { id: 'startDate', label: 'Start Date', required: true },
    { id: 'name', label: 'Name', required: true },
    { id: 'email', label: 'Email', required: true },
    { id: 'phone', label: 'Phone', required: true },
    { id: 'visa', label: 'Valid visa for this job location?', required: true },
  ]);

  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([
    { id: '1', question: '' },
  ]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [publishNow, setPublishNow] = useState(false);

  // Fetch job categories
  const { data: jobCategories, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['jobCategories'],
    queryFn: fetchJobCategories,
  });

  const steps = [
    { number: 1, title: 'Job Details', active: currentStep >= 1 },
    { number: 2, title: 'Job Description', active: currentStep >= 2 },
    { number: 3, title: 'Application Requirements', active: currentStep >= 3 },
    { number: 4, title: 'Custom Questions', active: currentStep >= 4 },
    { number: 5, title: 'Finish', active: currentStep >= 5 },
  ];

  const { mutate: publishJob, isPending } = useMutation({
    mutationFn: postJob,
    onSuccess: () => {
      toast.success('Job published successfully!');
      router.push('/jobs-success');
    },
    onError: (error) => {
      console.error('Error posting job:', error);
      toast.error('An error occurred while publishing the job.');
    },
  });

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.jobTitle || !formData.country || !formData.region || !formData.employmentType || !formData.experience || !formData.categoryId) {
        toast.error('Please fill in all required fields.');
        return;
      }
    }
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleCancel = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const toggleRequirement = (id: string) => {
    setApplicationRequirements((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, required: !req.required } : req
      )
    );
  };

  const addCustomQuestion = () => {
    const newQuestion: CustomQuestion = {
      id: Date.now().toString(),
      question: '',
    };
    setCustomQuestions((prev) => [...prev, newQuestion]);
  };

  const updateCustomQuestion = (id: string, newQuestionText: string) => {
    setCustomQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, question: newQuestionText } : q)),
    );
  };

  const handlePreviewClick = () => {
    setShowPreview(true);
  };

  const handleBackToEdit = () => {
    setShowPreview(false);
  };

  const handlePublish = () => {
    const responsibilities = formData.jobDescription
      .split('\n')
      .filter(line => line.startsWith('* '))
      .map(line => line.replace('* ', '').trim())
      .filter(line => line);

    const educationExperience = formData.jobDescription
      .split('Must-Have')[1]?.split('Nice-to-Have')[0]
      ?.split('\n')
      .filter(line => line.startsWith('* '))
      .map(line => line.replace('* ', '').trim())
      .filter(line => line) || [];

    const benefits = formData.jobDescription
      .split('Why Join Us?')[1]?.split('How to Apply')[0]
      ?.split('\n')
      .filter(line => line.startsWith('* '))
      .map(line => line.replace('* ', '').trim())
      .filter(line => line) || [];

    const experienceMap: Record<string, number> = {
      entry: 0,
      mid: 3,
      senior: 5,
      executive: 10,
    };

    const expirationDays = formData.expirationDate === 'custom' 
      ? 90 
      : parseInt(formData.expirationDate) || 30;

    const publishDateObj = publishNow 
      ? new Date() 
      : new Date(formData.publishDate || (selectedDate?.toISOString() ?? new Date().toISOString()));

    const deadlineDate = new Date(publishDateObj);
    deadlineDate.setDate(deadlineDate.getDate() + expirationDays);

    const postData = {
      userId,
      companyId,
      title: formData.jobTitle,
      description: formData.jobDescription,
      salaryRange: formData.compensation || '$0 - $0',
      location: `${formData.country}, ${formData.region}`,
      shift: formData.employmentType === 'full-time' ? 'Day' : 'Flexible',
      companyUrl: formData.companyUrl,
      responsibilities,
      educationExperience,
      benefits,
      vacancy: 2,
      experience: experienceMap[formData.experience] || 0,
      deadline: deadlineDate.toISOString(),
      publishDate: publishDateObj.toISOString(),
      status: 'active',
      jobCategoryId: formData.categoryId,
      employment_Type: formData.employmentType,
      compensation: formData.compensation ? 'Monthly' : 'Negotiable',
      archivedJob: false,
      applicationRequirement: applicationRequirements
        .filter(req => req.required)
        .map(req => ({ requirement: `${req.label} required` })),
      customQuestion: customQuestions
        .filter(q => q.question)
        .map(q => ({ question: q.question })),
    };

    publishJob(postData);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setFormData((prev) => ({
        ...prev,
        publishDate: date.toISOString(),
      }));
    }
  };

  const renderStepIndicator = () => (
    <>
      <div className="flex items-center justify-center mb-4 md:mb-8 overflow-x-auto">
        <div className="flex items-center min-w-max">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.active
                      ? 'bg-[#2B7FD0] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.number}
                </div>
                <span className="text-sm md:text-xl mt-2 text-[#000000] font-normal">
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 md:w-16 h-0.5 mx-2 md:mx-4 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="text-base md:text-xl text-[#000000] mb-6 font-medium text-center">
        Please update the candidate at every stage of their application journey
        with a simple click!
      </p>
    </>
  );

  const renderJobDetails = () => (
    <Card className="w-full mx-auto border-none shadow-none">
      <CardContent className="p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4 md:mb-6">
          Job Details
        </h2>
        <div className="space-y-4 md:space-y-6">
          {/* Job Title */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700" htmlFor="jobTitle">
              Job Title<span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="jobTitle"
                className="pl-10 border-gray-300 h-12 rounded-lg focus-visible:ring-2"
                placeholder="e.g. Software Engineer"
                value={formData.jobTitle}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2A2A2A]" htmlFor="department">
              Department (Optional)
            </Label>
            <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}>
              <SelectTrigger className="h-12 border-gray-300 rounded-lg focus:ring-2">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-lg">
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="hr">Human Resources</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location - Country & Region */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700" htmlFor="country">
                Country<span className="text-red-500 ml-1">*</span>
              </Label>
              <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, country: value }))}>
                <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="rounded-lg shadow-lg">
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="ca">Canada</SelectItem>
                  <SelectItem value="au">Australia</SelectItem>
                  <SelectItem value="in">India</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700" htmlFor="region">
                Region/State<span className="text-red-500 ml-1">*</span>
              </Label>
              <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, region: value }))}>
                <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent className="rounded-lg shadow-lg">
                  <SelectItem value="west">West</SelectItem>
                  <SelectItem value="east">East</SelectItem>
                  <SelectItem value="central">Central</SelectItem>
                  <SelectItem value="north">North</SelectItem>
                  <SelectItem value="south">South</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Employment Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700" htmlFor="employmentType">
              Employment Type<span className="text-red-500 ml-1">*</span>
            </Label>
            <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, employmentType: value }))}>
              <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                <SelectValue placeholder="Select employment type" />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-lg">
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
               
              </SelectContent>
            </Select>
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700" htmlFor="experience">
              Experience Level<span className="text-red-500 ml-1">*</span>
            </Label>
            <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, experience: value }))}>
              <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-lg">
                <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                <SelectItem value="senior">Senior Level (5+ years)</SelectItem>
                <SelectItem value="executive">Executive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Job Category */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700" htmlFor="category">
              Job Category<span className="text-red-500 ml-1">*</span>
            </Label>
            <Select 
              onValueChange={(value) => {
                const selectedCategory = jobCategories?.data.find((cat: JobCategory) => cat._id === value);
                setFormData((prev) => ({
                  ...prev,
                  category: selectedCategory?.name || '',
                  categoryId: value,
                }));
              }}
            >
              <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select category"} />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-lg">
                {categoriesLoading ? (
                  <SelectItem value="loading">Loading...</SelectItem>
                ) : categoriesError ? (
                  <SelectItem value="error">Error loading categories</SelectItem>
                ) : jobCategories?.data.map((category: JobCategory) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categoriesError && (
              <p className="text-sm text-red-500">Failed to load categories</p>
            )}
          </div>

          {/* Compensation */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700" htmlFor="compensation">
              Compensation (Optional)
            </Label>
            <Input
              id="compensation"
              className="h-12 border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500"
              placeholder="e.g. $80,000 - $100,000 per year"
              value={formData.compensation}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  compensation: e.target.value,
                }))
              }
            />
          </div>

          {/* Company URL */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700" htmlFor="companyUrl">
              Company Website URL (Optional)
            </Label>
            <Input
              id="companyUrl"
              type="url"
              className="h-12 border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500"
              placeholder="e.g. https://yourcompany.com"
              value={formData.companyUrl}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  companyUrl: e.target.value,
                }))
              }
            />
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700" htmlFor="expirationDate">
              Job Posting Expiration Date
              <span className="text-gray-500 ml-1">(Posting can be reopened)</span>
            </Label>
            <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, expirationDate: value }))}>
              <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                <SelectValue placeholder="Select expiration date" />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-lg">
                <SelectItem value="30">30 days from now</SelectItem>
                <SelectItem value="60">60 days from now</SelectItem>
                <SelectItem value="90">90 days from now</SelectItem>
                <SelectItem value="custom">Custom date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 md:gap-7 mt-6 md:mt-8">
          <Button
            variant="outline"
            className="h-11 px-4 md:px-6 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            className="h-11 px-4 md:px-6 bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 rounded-lg text-white"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderJobDescription = () => (
    <div className='bg-white p-10 rounded-md'>
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 ">
        {/* Left Column: Job Description Editor */}
        <Card className="lg:col-span-2 border-none shadow-none">
          <CardContent className="p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-[#000000] mb-4 md:mb-6">
              Job Description
            </h2>
            <div className="space-y-4">
              <TextEditor
                value={formData.jobDescription}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, jobDescription: value }))
                }
              />
              <p className="text-sm text-gray-600">
                Character count: {formData.jobDescription.length}/2000
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Tips and Publish Schedule */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          {/* TIP Section */}
          <Card className="border-none shadow-none">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start space-x-2 mb-3 md:mb-4">
                <Info className="h-5 w-5 text-[#9EC7DC]" />
                <h3 className="text-base font-semibold text-[#9EC7DC]">TIP</h3>
              </div>
              <p className="text-sm md:text-base text-[#000000] mb-3 md:mb-4">
                Job boards will often reject jobs that do not have quality job
                descriptions. To ensure that your job description matches the
                requirements for job boards, consider the following guidelines:
              </p>
              <ul className="list-disc list-inside text-sm md:text-base text-[#000000] space-y-1 md:space-y-2">
                <li>Job descriptions should be clear, well-written, and informative</li>
                <li>Job descriptions with 700-2,000 characters get the most interaction</li>
                <li>Do not use discriminatory language</li>
                <li>Do not post offensive or inappropriate content</li>
                <li>Be honest about the job requirement details</li>
                <li>Help the candidate understand the expectations for this role</li>
              </ul>
              <p className="text-sm md:text-base text-[#000000] mt-3 md:mt-4">
                For more tips on writing good job descriptions,{' '}
                <a href="#" className="text-[#9EC7DC]">
                  read our help article.
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Publish Schedule Section */}
          <Card className="border-none shadow-none">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-sm md:text-base font-semibold text-[#000000]">Publish Now</h3>
                <Switch 
                  checked={publishNow} 
                  onCheckedChange={setPublishNow}
                  className="data-[state=checked]:bg-[#2B7FD0]"
                />
              </div>
              
              {!publishNow && (
                <>
                  <h3 className="text-sm md:text-base font-semibold mb-3 md:mb-4">Schedule Publish</h3>
                  <div className="border rounded-lg p-3">
                    <CustomCalendar
                      selectedDate={selectedDate}
                      onDateSelect={handleDateSelect}
                    />
                  </div>
                  {selectedDate && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected date: {selectedDate.toLocaleDateString()}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex justify-end gap-4 md:gap-7 mt-4 md:mt-6">
        <Button 
          className='border border-[#2B7FD0] hover:bg-transparent text-[#2B7FD0]' 
          variant="outline" 
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button className='bg-[#2B7FD0] h-[40px] hover:bg-[#2B7FD0]/85' onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  );

  const renderApplicationRequirements = () => (
    <Card className="w-full mx-auto border-none shadow-none">
      <CardContent className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-[#000000]">Application Requirement</h2>
        </div>
        <p className="text-base md:text-xl text-[#000000] mb-4 md:mb-6">
          What personal info would you like to gather about each applicant?
        </p>
        <div className="space-y-3 md:space-y-4">
          {applicationRequirements.map((requirement) => (
            <div
              key={requirement.id}
              className="flex items-center justify-between py-2 border-b pb-6 md:pb-10"
            >
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-[18px] h-[18px] md:w-[22px] md:h-[22px] bg-[#2B7FD0] rounded-full flex items-center justify-center">
                  <Check className='text-white w-3 h-3 md:w-4 md:h-4' />
                </div>
                <span className="text-base md:text-xl text-[#000000] font-normal">{requirement.label}</span>
              </div>
              <div className="flex space-x-1 md:space-x-2">
                <Button
                  variant={!requirement.required ? 'default' : 'outline'}
                  className={`h-8 md:h-9 px-3 md:px-4 rounded-lg text-xs md:text-sm font-medium ${
                    !requirement.required
                      ? 'bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90'
                      : 'border-[#2B7FD0] text-[#2B7FD0] hover:bg-transparent'
                  }`}
                  onClick={() => toggleRequirement(requirement.id)}
                >
                  Optional
                </Button>
                <Button
                  variant={requirement.required ? 'default' : 'outline'}
                  className={`h-8 md:h-9 px-3 md:px-4 rounded-lg text-xs md:text-sm font-medium ${
                    requirement.required
                      ? 'bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90'
                      : 'border-[#2B7FD0] text-[#2B7FD0] hover:bg-transparent'
                  }`}
                  onClick={() => toggleRequirement(requirement.id)}
                >
                  Required
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-4 md:gap-7 mt-4 md:mt-6">
          <Button
            variant="outline"
            className="h-11 px-4 md:px-6 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            className="h-11 px-4 md:px-6 bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 rounded-lg text-white"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCustomQuestions = () => (
    <Card className="w-full mx-auto border-none shadow-none">
      <CardContent className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-[#000000]">Add Custom Questions</h2>
          <Button
            className="border border-[#2B7FD0] h-[40px] md:h-[50px] px-[16px] md:px-[32px] rounded-[8px] hover:bg-transparent text-[#2B7FD0] text-sm md:text-base font-medium hover:text-[#2B7FD0]"
            variant="outline"
            size="sm"
            onClick={handleNext}
          >
            Skip
          </Button>
        </div>
        <p className="text-base md:text-xl text-[#808080] font-medium mt-[40px] md:mt-[80px] mb-[15px] md:mb-[30px]">
          Would you require visa sponsorship for this role within the next two years?
        </p>
        <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
          {customQuestions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <Label className="text-base md:text-xl font-medium text-[#2B7FD0]">Ask a question</Label>
              <textarea
                name={`customQuestion-${question.id}`}
                placeholder="Write Here"
                className="flex min-h-[60px] md:min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={question.question}
                onChange={(e) => updateCustomQuestion(question.id, e.target.value)}
              />
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={addCustomQuestion}
          className="border-none mb-4 md:mb-6 text-[#2B7FD0] flex items-center justify-center text-base md:text-xl font-medium hover:text-[#2B7FD0] hover:bg-transparent"
        >
          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center mr-2 bg-[#2B7FD0]">
            <Plus className="w-3 h-3 md:w-4 md:h-4 text-white" />
          </div>
          Add a question
        </Button>
        <div className="flex justify-end gap-4 md:gap-7">
          <Button
            variant="outline"
            className="h-11 px-4 md:px-6 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            className="h-11 px-4 md:px-6 bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 rounded-lg text-white"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderFinish = () => (
    <div className="flex justify-center items-center min-h-[40vh] md:min-h-[50vh]">
      <Card className="w-full max-w-md md:max-w-2xl border-none shadow-none">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col items-center justify-center space-y-3 md:space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-[#131313] mb-4 md:mb-8">
              Your job posting is ready!
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full justify-center">
              <Button
                variant="outline"
                className="w-full sm:w-[200px] md:w-[267px] h-10 md:h-12 border-[#2B7FD0] text-[#2B7FD0] hover:bg-transparent hover:text-[#2B7FD0]"
                onClick={handlePreviewClick}
              >
                Preview Your Post
              </Button>
              <Button
                className="w-full sm:w-[200px] md:w-[267px] h-10 md:h-12 bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 text-white"
                onClick={handlePublish}
                disabled={isPending}
              >
                {isPending ? 'Publishing...' : 'Publish Your Post'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#E6E6E6] py-4 md:py-8">
      {showPreview ? (
        <JobPreview
          formData={formData}
          companyUrl={formData.companyUrl}
          applicationRequirements={applicationRequirements}
          customQuestions={customQuestions}
          selectedDate={selectedDate}
          publishNow={publishNow}
          onBackToEdit={handleBackToEdit}
        />
      ) : (
        <div className="container mx-auto px-2 sm:px-4">
          <h1 className="text-2xl md:text-[48px] text-[#131313] font-bold text-center mb-4 md:mb-8">
            Create Job Posting
          </h1>
          {renderStepIndicator()}
          {currentStep === 1 && renderJobDetails()}
          {currentStep === 2 && renderJobDescription()}
          {currentStep === 3 && renderApplicationRequirements()}
          {currentStep === 4 && renderCustomQuestions()}
          {currentStep === 5 && renderFinish()}
        </div>
      )}
    </div>
  );
}