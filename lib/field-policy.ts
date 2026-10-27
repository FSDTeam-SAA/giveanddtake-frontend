// Shared by native input controls so create, edit and preview forms use the
// same limits. Unknown fields retain their own explicit rules.
export function fieldCharacterLimit(field?: string): number | undefined {
  if (!field) return undefined;
  const key = field.split('.').at(-1)!.replace(/[^a-z]/gi, '').toLowerCase();
  const limits: Record<string, number> = {
    email: 254, emailaddress: 254, cemail: 254, newemail: 254,
    aboutus: 1400, aboutme: 1400, bio: 1400, subject: 50, message: 500,
    description: 1400, phone: 50, phonenumber: 50, phonenum: 50,
    firstname: 20, lastname: 40, surname: 40, surename: 40,
    cname: 160, company: 160, companyname: 160, employer: 160,
    awardshortdescription: 500, awardtitle: 150, programname: 150, programename: 150,
    jobtitle: 100, position: 100, currentposition: 100,
    institutename: 150, institutionname: 150, institution: 150, degree: 100, fieldofstudy: 100,
    zip: 20, zipcode: 20, department: 100,
    url: 2048, companyurl: 200, companywebsite: 200, requirement: 200, question: 500,
    role: 100, compensation: 50, region: 100,
    platform: 50, label: 50, language: 50, certification: 100,
    city: 100, country: 100, industry: 100,
    startdate: 30, enddate: 30, graduationdate: 30,
  };
  if (key === 'title') return /award|honor/i.test(field) ? 150 : 100;
  if (key === 'description' && /award|honor/i.test(field)) return 500;
  if (key === 'jobdescription') return 1400;
  return limits[key];
}

export function fieldLabel(value: string): string {
  return value;
}

export function limitFieldEdit(value: string, max?: number, previous?: string): string {
  if (max === undefined || value.length <= max) return value;
  // Let users repair a saved over-limit value without deleting its suffix.
  if (previous && previous.length > max && value.length < previous.length) return value;
  const shortened = value.slice(0, max);
  // Avoid splitting a Unicode surrogate pair at the boundary.
  return /[\uD800-\uDBFF]$/.test(shortened) ? shortened.slice(0, -1) : shortened;
}

// Field arrays can have nested errors without a message on the array itself.
// Only render actual messages, never String(undefined) or a DOM ref.
export function fieldErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const item = error as Record<string, unknown>;
  if (typeof item.message === 'string' && item.message.trim()) return item.message;
  for (const [key, value] of Object.entries(item)) {
    if (key === 'ref' || key === 'types') continue;
    const message = fieldErrorMessage(value);
    if (message) return message;
  }
  return undefined;
}
