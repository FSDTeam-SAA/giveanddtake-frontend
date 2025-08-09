'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Info, Check, X } from 'lucide-react';
import Link from 'next/link';
import CustomCalendar from './CustomCalendar'; // Ensure this import matches your project structure

interface ApplicationRequirement {
  id: string;
  label: string;
  required: boolean;
}

interface CustomQuestion {
  id: string;
  question: string;
}

interface JobPreviewProps {
  formData: {
    jobTitle: string;
    department: string;
    country: string;
    region: string;
    employmentType: string;
    experience: string;
    category: string;
    compensation: string;
    expirationDate: string;
    jobDescription: string;
  };
  applicationRequirements: ApplicationRequirement[];
  customQuestions: CustomQuestion[];
  selectedDate: Date | undefined;
  publishNow: boolean;
  companyUrl: string;
  onBackToEdit: () => void;
}

export default function JobPreview({
  formData,
  applicationRequirements,
  customQuestions,
  selectedDate,
  companyUrl,
  publishNow,
  onBackToEdit,
}: JobPreviewProps) {
  return (
    <div className="min-h-screen py-8 px-4 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto   p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mx-auto">Preview Job Posting</h1>
          <Button variant="ghost" size="icon" onClick={onBackToEdit}>
            <X className="h-6 w-6 text-gray-500" />
          </Button>
        </div>

        {/* Job Details Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Job Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Job Title</p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.jobTitle || 'N/A'}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Department</p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.department || 'N/A'}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Country</p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.country || 'N/A'}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Region/State</p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.region || 'N/A'}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Employment Type</p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.employmentType || 'N/A'}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Experience Level</p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.experience || 'N/A'}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Job Category</p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.category || 'N/A'}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Compensation</p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.compensation || 'N/A'}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Company Website</p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {companyUrl ? (
                  <Link href={companyUrl.startsWith('http') ? companyUrl : `https://${companyUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline">
                    {companyUrl}
                  </Link>
                ) : 'N/A'}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Job Posting Expiration Date</p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.expirationDate || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Rest of the component remains the same */}
        {/* Job Description Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 bg-white">
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Job Description</h2>
              <div className="space-y-4">
                <div
                  className="p-4 border border-gray-300 rounded-lg  text-gray-800 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: formData.jobDescription }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Tips and Publish Schedule */}
          <div className="lg:col-span-1 space-y-6">
            {/* TIP Section */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-2 mb-4">
                  <Info className="h-5 w-5 text-[#9EC7DC]" />
                  <h3 className="text-base font-semibold text-[#9EC7DC]">TIP</h3>
                </div>
                <p className="text-base text-gray-800 mb-4">
                  Job boards will often reject jobs that do not have quality job
                  descriptions. To ensure that your job description matches the
                  requirements for job boards, consider the following guidelines:
                </p>
                <ul className="list-disc list-inside text-base text-gray-800 space-y-2">
                  <li>Job descriptions should be clear, well-written, and informative</li>
                  <li>Job descriptions with 700-2,000 characters get the most interaction</li>
                  <li>Do not use discriminatory language</li>
                  <li>Do not post offensive or inappropriate content</li>
                  <li>Be honest about the job requirement details</li>
                  <li>Help the candidate understand the expectations for this role</li>
                </ul>
                <p className="text-base text-gray-800 mt-4">
                  For more tips on writing good job descriptions,{' '}
                  <Link href="#" className="text-[#9EC7DC]">
                    read our help article.
                  </Link>
                </p>
              </CardContent>
            </Card>

            {/* Publish Schedule Section */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Publish Now</h3>
                  <Switch className="!bg-[#2B7FD0]" checked={publishNow} disabled />
                </div>
                <h3 className="text-base font-semibold mb-4">Schedule Publish</h3>
                <div className="border rounded-lg p-3">
                  <CustomCalendar
                    selectedDate={selectedDate}
                    onDateSelect={() => {}} // No-op function since preview is read-only
                  />
                </div>
                {selectedDate && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected date: {selectedDate.toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Application Requirements Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Application Requirements</h2>
          <p className="text-xl text-gray-800 mb-6">
            What personal info would you like to gather about each applicant?
          </p>
          <div className="space-y-4">
            {applicationRequirements.map((requirement) => (
              <div
                key={requirement.id}
                className="flex items-center justify-between py-2 border-b pb-10"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-[22px] h-[22px] bg-[#2B7FD0] rounded-full flex items-center justify-center">
                    <Check className="text-white w-4 h-4" />
                  </div>
                  <span className="text-xl text-gray-900 font-normal">{requirement.label}</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant={!requirement.required ? 'default' : 'outline'}
                    className={`h-9 px-4 rounded-lg text-sm font-medium ${
                      !requirement.required
                        ? 'bg-[#2B7FD0] text-white'
                        : 'border-[#2B7FD0] text-[#2B7FD0]'
                    }`}
                    disabled // Make buttons non-interactive
                  >
                    Optional
                  </Button>
                  <Button
                    variant={requirement.required ? 'default' : 'outline'}
                    className={`h-9 px-4 rounded-lg text-sm font-medium ${
                      requirement.required
                        ? 'bg-[#2B7FD0] text-white'
                        : 'border-[#2B7FD0] text-[#2B7FD0]'
                    }`}
                    disabled // Make buttons non-interactive
                  >
                    Required
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Questions Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Custom Questions</h2>
          <p className="text-xl text-gray-500 font-medium mt-[80px] mb-[30px]">
            Would you require visa sponsorship for this role within the next two years?
          </p>
          <div className="space-y-4 mb-6">
            {customQuestions.map((question) => (
              <div key={question.id} className="space-y-2">
                <p className="text-xl font-medium text-[#2B7FD0]">Ask a question</p>
                <div className="flex min-h-[80px] w-full rounded-md border border-gray-300  px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap">
                  {question.question || 'No question entered.'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <Button
            variant="outline"
            className="w-full sm:w-[267px] h-12 border-[#2B7FD0] text-[#2B7FD0] hover:bg-transparent hover:text-[#2B7FD0]"
            onClick={onBackToEdit}
          >
            Back to Edit
          </Button>
          <Button
            className="w-full sm:w-[267px] h-12 bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 text-white"
          >
            Publish Your Post
          </Button>
        </div>
      </div>
    </div>
  );
}