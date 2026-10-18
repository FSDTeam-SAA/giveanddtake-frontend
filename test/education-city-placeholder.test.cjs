const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function find(element, predicate) {
  if (!element || typeof element !== 'object') return undefined;
  if (predicate(element)) return element;
  for (const child of [element.props?.children].flat(Infinity)) {
    const match = find(child, predicate);
    if (match) return match;
  }
}

for (const folder of ['resume', 'update-resume']) {
  for (const scenario of [
    { name: 'no country', country: '', city: '', cities: [], loading: false, label: 'Select country first', disabled: true },
    { name: 'saved city loading', country: 'Nigeria', city: 'Abuja', cities: [], loading: true, label: 'Loading cities...', disabled: true },
    { name: 'saved city without a country', country: '', city: 'Abuja', cities: [], loading: false, label: 'Select country first', disabled: true },
    { name: 'saved city loaded', country: 'Nigeria', city: 'Abuja', cities: ['Abuja'], loading: false, label: 'Abuja', disabled: false },
    { name: 'city missing from catalog', country: 'Nigeria', city: 'Abuja', cities: ['Lagos'], loading: false, label: 'Select City', disabled: false },
  ]) {
    test(`${folder}/education: ${scenario.name} keeps City text visible`, () => {
      const rows = [{ country: scenario.country, city: scenario.city }];
      const form = { control: {}, watch: () => rows };
      const stub = () => null;
      const modules = new Map();
      function load(relative) {
        if (modules.has(relative)) return modules.get(relative);
        const source = fs.readFileSync(path.resolve(__dirname, '..', relative), 'utf8');
        const { outputText } = ts.transpileModule(source, {
          compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
        });
        const context = { exports: {}, require: name => {
          if (name === 'react') return {
            useEffect() {}, useMemo: fn => fn(), useState: initial => [initial, () => {}],
          };
          if (name === 'react/jsx-runtime') return require(name);
          if (name === '@tanstack/react-query') return { useQuery: () => ({ data: [], isLoading: false }) };
          if (name === '@/hooks/use-resume-entry-cities') return { useResumeEntryCities: () => ({
            selectedCountries: [scenario.country], citiesData: [scenario.cities], loadingCities: [scenario.loading],
          }) };
          if (name === '@/components/ui/combo-box') return load('components/ui/combo-box.tsx');
          return new Proxy({}, { get: () => stub });
        } };
        vm.runInNewContext(outputText, context);
        modules.set(relative, context.exports);
        return context.exports;
      }
      const { EducationSection } = load(`app/(website)/elevator-video-pitch/_components/${folder}/education-section.tsx`);
      const section = EducationSection({ form, educationFields: [{ id: 'education-0' }] });
      const field = find(section, element => element.props?.name === 'educationList.0.city');
      const rendered = field.props.render({ field: { value: scenario.city, onChange() {} } });
      const combobox = find(rendered, element => Array.isArray(element.props?.options));
      const trigger = find(combobox.type(combobox.props), element => element.props?.role === 'combobox');
      assert.equal(trigger.props.children[0], scenario.label);
      assert.equal(trigger.props.disabled, scenario.disabled);
    });
  }
}
