const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const root = path.resolve(__dirname, '..');
const empty = () => null;
const box = ({ children, className }) => React.createElement('div', { className }, children);

function renderProfile(file, data, props) {
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename);
    const source = fs.readFileSync(filename, 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    }}).outputText;
    const scope = { exports: {}, require: name => {
      if (name === 'next-auth/react') return { useSession: () => ({ data: null }) };
      if (name === '@tanstack/react-query') return {
        useQuery: () => ({ data: { success: true, data }, isLoading: false, isFetching: false }),
        useMutation: () => ({}), useQueryClient: () => ({}),
      };
      if (name === '@/hooks/use-qualifications') return { useQualifications: () => ({ label: value => value }) };
      if (name === 'next/image') return { __esModule: true, default: empty };
      if (name === 'next/link') return { __esModule: true, default: ({ children, href }) => React.createElement('a', { href }, children) };
      if (name === '@/components/ui/card') return { Card: box, CardContent: box, CardHeader: box, CardTitle: box };
      if (name === '@/components/ui/dropdown-menu') return Object.fromEntries(['DropdownMenu', 'DropdownMenuTrigger', 'DropdownMenuContent', 'DropdownMenuItem'].map(key => [key, box]));
      if (name === '@/lib/api-service') return {};
      if (['./candidateShare', './elevator-pitch-upload', './SocialLinks', '../../elevator-video-pitch/_components/SocialLinks', '@/components/VideoProcessingCard', '@/components/VideoFailedCard', '@/components/company/video-player', '@/components/company/social-icon'].includes(name)) {
        return { __esModule: true, default: empty, ElevatorPitchUpload: empty, VideoProcessingCard: empty, VideoFailedCard: empty, VideoPlayer: empty, SocialIcon: empty };
      }
      if (name.startsWith('@/')) {
        const base = path.join(root, name.slice(2));
        return load(['.ts', '.tsx'].map(ext => base + ext).find(fs.existsSync));
      }
      return require(name);
    }};
    vm.runInNewContext(code, scope);
    cache.set(filename, scope.exports);
    return scope.exports;
  }
  const Profile = load(path.join(root, file)).default;
  return renderToStaticMarkup(React.createElement(Profile, props));
}

const data = {
  resume: { _id: 'profile', userId: 'candidate', firstName: 'Alex', lastName: 'Candidate', skills: ['Leadership'], country: 'Profile Country', city: 'Profile City', sLink: [] },
  experiences: [{ _id: 'work', position: 'Engineer', company: 'Existing Employer', city: 'Work City', country: 'Work Country', startDate: '2024-01-01' }],
  education: [
    { _id: 'one', instituteName: 'Example University', degree: 'M.B.A', fieldOfStudy: 'Finance', city: 'Education City', country: 'Education Country', startDate: '2020-10-01', graduationDate: '2022-01-01' },
    { _id: 'two', instituteName: 'Independent College', degree: 'B.A', fieldOfStudy: 'English', country: '', startDate: '2016-09-01', graduationDate: '2019-06-01' },
  ],
  awardsAndHonors: [], elevatorPitch: [],
};

for (const [name, file, props] of [
  ['public candidate profile', 'app/(website)/cp/_components/candidates.tsx', { userId: 'candidate' }],
  ['My EVP Profile', 'app/(website)/elevator-video-pitch/_components/resume.tsx', { resume: data, onEdit: empty }],
]) {
  test(`${name}: education renders institutions instead of location while preserving qualifications and dates`, () => {
    const html = renderProfile(file, data, props);
    const sections = html.match(/<section\b[\s\S]*?<\/section>/g) || [];
    const education = sections.find(section => /<h3[^>]*>Education<\/h3>/.test(section));
    assert.ok(education, 'Education section renders');
    for (const text of ['Example University', 'Independent College', 'M.B.A', 'Finance', 'B.A', 'English', 'Oct 2020', 'Jan 2022']) assert.ok(education.includes(text), text);
    assert.ok(!education.includes('Education City'));
    assert.ok(!education.includes('Education Country'));
    assert.ok(html.includes('Work Country'), 'Experience location remains present');
    assert.ok(html.includes('Profile Country'), 'Profile location remains present');
  });
}
