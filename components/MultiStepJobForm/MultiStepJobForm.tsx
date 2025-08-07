'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Info } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import TextEditor from './TextEditor';


interface ApplicationRequirement {
  id: string;
  label: string;
  required: boolean;
}

interface CustomQuestion {
  id: string;
  question: string;
}

export default function MultiStepJobForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    jobTitle: '',
    department: '',
    country: '',
    region: '',
    employmentType: '',
    experience: '',
    category: '',
    compensation: '',
    expirationDate: '',
    jobDescription: `Your MissionDrive organic growth and boost online visibility for [Company Name] by developing cutting-edge SEO strategies that dominate search rankings and convert traffic into customers.Key Responsibilities* Keyword Strategy: Research high-impact keywords for content, products, and campaigns.* On-Page Optimization: Optimize website content, meta tags, headers, and URLs.* Technical SEO: Audit site health (speed, mobile-friendliness, indexing) using tools like Screaming Frog/Ahrefs.* Content Collaboration: Partner with content teams to create SEO-optimized blogs, guides, and landing pages.* Backlink Building: Develop ethical link-building strategies to boost domain authority.* Data-Driven Reporting: Track KPIs (traffic, rankings, conversions) via Google Analytics/Search Console.* Stay Ahead: Monitor algorithm updates (Google Core Updates) and industry trends.What We're Looking ForMust-Have* 2+ years hands-on SEO experience* Proven success growing organic traffic & rankings* Proficiency in SEO tools (Ahrefs, SEMrush, Moz)* Strong analytics skills (GA4, Looker Studio)* Technical SEO knowledge (schema, XML sitemaps)* Excellent communication skillsNice-to-Have* Experience with e-commerce/SaaS SEO* Basic HTML/CSS understanding* Local SEO or international SEO expertise* Content marketing backgroundWhy Join Us?* Competitive salary + [bonus/equity options]* Flexible PTO + [remote work/wellness stipends]* Grow your skills with [training/conference budgets]* Collaborative team passionate about data-driven results* [Add another unique perk]How to ApplySubmit your resume and 1-minute elevator pitch video (share via link) showing:1. Your biggest SEO win2. Why you're excited about this roleVideo tip: 60 seconds free—or go premium for 3 minutes!Apply by: [Date]Contact: [Email/Link to Application Portal]`,
  });
  const [applicationRequirements, setApplicationRequirements] = useState<
    ApplicationRequirement[]
  >([
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
    {
      id: '1',
      question:
        'Would you require visa sponsorship for this role within the next two years?',
    },
    { id: '2', question: 'Ask a question' },
  ]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [publishNow, setPublishNow] = useState(true);

  const steps = [
    { number: 1, title: 'Job Details', active: currentStep >= 1 },
    { number: 2, title: 'Job Description', active: currentStep >= 2 },
    { number: 3, title: 'Application Requirements', active: currentStep >= 3 },
    { number: 4, title: 'Custom Questions', active: currentStep >= 4 },
    { number: 5, title: 'Finish', active: currentStep >= 5 },
  ];

  const handleNext = () => {
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
      question: '', // Initialize with empty string for user input
    };
    setCustomQuestions((prev) => [...prev, newQuestion]);
  };

  const updateCustomQuestion = (id: string, newQuestionText: string) => {
    setCustomQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, question: newQuestionText } : q))
    );
  };

  const renderStepIndicator = () => (
    <>
      <div className="flex items-center justify-center mb-8">
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
              <span className="text-xl mt-2 text-[#000000] font-normal">
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-xl text-[#000000] mb-6 font-medium text-center">
        Please update the candidate at every stage of their application journey
        with a simple click!
      </p>
    </>
  );

  const renderJobDetails = () => (
    <Card className="container mx-auto border-none shadow-sm">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Job Details
        </h2>
        <div className="space-y-6">
          {/* Job Title */}
          <div className="space-y-2">
            <Label
              className="text-sm font-medium text-gray-700"
              htmlFor="jobTitle"
            >
              Job Title
              <span className="text-red-500 ml-1">*</span>
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
            <Label
              className="text-sm font-medium text-[#2A2A2A]"
              htmlFor="department"
            >
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
              <Label
                className="text-sm font-medium text-gray-700"
                htmlFor="country"
              >
                Country
                <span className="text-red-500 ml-1">*</span>
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
              <Label
                className="text-sm font-medium text-gray-700"
                htmlFor="region"
              >
                Region/State
                <span className="text-red-500 ml-1">*</span>
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
            <Label
              className="text-sm font-medium text-gray-700"
              htmlFor="employmentType"
            >
              Employment Type
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, employmentType: value }))}>
              <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                <SelectValue placeholder="Select employment type" />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-lg">
                <SelectItem value="fulltime">Full-time</SelectItem>
                <SelectItem value="parttime">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Experience Level */}
          <div className="space-y-2">
            <Label
              className="text-sm font-medium text-gray-700"
              htmlFor="experience"
            >
              Experience Level
              <span className="text-red-500 ml-1">*</span>
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
            <Label
              className="text-sm font-medium text-gray-700"
              htmlFor="category"
            >
              Job Category
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}>
              <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-lg">
                <SelectItem value="tech">Technology</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="education">Education</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Compensation */}
          <div className="space-y-2">
            <Label
              className="text-sm font-medium text-gray-700"
              htmlFor="compensation"
            >
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
          {/* Expiration Date */}
          <div className="space-y-2">
            <Label
              className="text-sm font-medium text-gray-700"
              htmlFor="expirationDate"
            >
              Job Posting Expiration Date
              <span className="text-gray-500 ml-1">
                (Posting can be reopened)
              </span>
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
        <div className="flex justify-end gap-7 mt-8">
          <Button
            variant="outline"
            className="h-11 px-6 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderJobDescription = () => (
    <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Job Description Editor */}
      <Card className="lg:col-span-2 border-none shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Job Description
          </h2>
          <div className="space-y-4">
            <TextEditor
              value={formData.jobDescription}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, jobDescription: value }))
              }
            />
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleNext}>Next</Button>
          </div>
        </CardContent>
      </Card>
      {/* Right Column: Tips and Publish Schedule */}
      <div className="lg:col-span-1 space-y-6">
        {/* TIP Section */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start space-x-2 mb-4">
              <Info className="h-5 w-5 text-blue-500" />
              <h3 className="text-sm font-semibold text-blue-500">TIP</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Job boards will often reject jobs that do not have quality job
              descriptions. To ensure that your job description matches the
              requirements for job boards, consider the following guidelines:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
              <li>Job descriptions should be clear, well-written, and informative</li>
              <li>Job descriptions with 700-2,000 characters get the most interaction</li>
              <li>Do not use discriminatory language</li>
              <li>Do not post offensive or inappropriate content</li>
              <li>Be honest about the job requirement details</li>
              <li>Help the candidate understand the expectations for this role</li>
            </ul>
            <p className="text-sm text-gray-700 mt-4">
              For more tips on writing good job descriptions,{' '}
              <Link href="#" className="text-blue-600 underline">
                read our help article.
              </Link>
            </p>
          </CardContent>
        </Card>
        {/* Publish Schedule Section */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Publish Now</h3>
              <Switch checked={publishNow} onCheckedChange={setPublishNow} />
            </div>
            <h3 className="text-base font-semibold mb-4">Schedule Publish</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border w-full"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderApplicationRequirements = () => (
    <Card className="container mx-auto">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Application Requirement</h2>
          <Button variant="outline" size="sm">
            Skip
          </Button>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          What personal info would you like to gather about each applicant?
        </p>
        <div className="space-y-4">
          {applicationRequirements.map((requirement) => (
            <div
              key={requirement.id}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm">{requirement.label}</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={!requirement.required ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleRequirement(requirement.id)}
                >
                  Optional
                </Button>
                <Button
                  variant={requirement.required ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleRequirement(requirement.id)}
                >
                  Required
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleNext}>Next</Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCustomQuestions = () => (
    <Card className="container mx-auto">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Add Custom Questions</h2>
          <Button variant="outline" size="sm">
            Skip
          </Button>
        </div>
        <div className="space-y-4 mb-6">
          {customQuestions.map((question, index) => (
            <div key={question.id} className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                {index === 0 ? question.question : 'Custom Question:'}
              </p>
              <Input
                placeholder="Enter your question..."
                className="mt-2"
                value={question.question}
                onChange={(e) => updateCustomQuestion(question.id, e.target.value)}
              />
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={addCustomQuestion}
          className="w-full mb-6 text-blue-600 border-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add a question
        </Button>
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleNext}>Next</Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderFinish = () => (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6 text-center">
        <div className="space-y-4">
          <Button variant="outline" className="w-full">
            Preview Your Post
          </Button>
          <Button className="w-full">Publish Your Post</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-[48px] text-[#131313] font-bold text-center mb-8">
          Create Job Posting
        </h1>
        {renderStepIndicator()}
        {currentStep === 1 && renderJobDetails()}
        {currentStep === 2 && renderJobDescription()}
        {currentStep === 3 && renderApplicationRequirements()}
        {currentStep === 4 && renderCustomQuestions()}
        {currentStep === 5 && renderFinish()}
      </div>
    </div>
  );
}
