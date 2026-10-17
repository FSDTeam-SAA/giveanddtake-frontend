const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { QueryClient, QueriesObserver } = require('@tanstack/react-query');

function find(element, predicate) {
  if (!element || typeof element !== 'object') return undefined;
  if (predicate(element)) return element;
  for (const child of [element.props?.children].flat(Infinity)) {
    const match = find(child, predicate);
    if (match) return match;
  }
}

for (const folder of ['resume', 'update-resume']) {
  for (const kind of ['education', 'experience']) {
    test(`${folder}/${kind}: changing a row country clears only its own city`, () => {
      const name = kind === 'experience' ? 'experiences' : 'educationList';
      const rows = [{ country: 'Nigeria', city: 'Lagos' }, { country: 'United Kingdom', city: 'London' }];
      const profile = { country: 'United Kingdom', city: 'London' };
      const countryCities = { Nigeria: ['Lagos'], 'United Kingdom': ['London'], Canada: ['Toronto'] };
      const form = {
        control: {},
        watch: field => field === name ? rows : undefined,
        setValue(field, value) {
          const [section, index, key] = field.split('.');
          assert.equal(section, name);
          rows[index][key] = value;
        },
      };
      const stub = () => null;
      const { outputText } = ts.transpileModule(fs.readFileSync(path.resolve(__dirname,
        `../app/(website)/elevator-video-pitch/_components/${folder}/${kind}-section.tsx`), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
      });
      const context = { exports: {}, require: moduleName => {
        if (moduleName === 'react') return { useEffect() {}, useMemo: callback => callback() };
        if (moduleName === 'react/jsx-runtime') return require(moduleName);
        if (moduleName === '@tanstack/react-query') return { useQuery: () => ({ data: [], isLoading: false }) };
        if (moduleName === '@/hooks/use-resume-entry-cities') return { useResumeEntryCities: (passedForm, section) => {
          assert.equal(passedForm, form);
          assert.equal(section, name);
          return { selectedCountries: rows.map(row => row.country), citiesData: rows.map(row => countryCities[row.country]), loadingCities: [false, false] };
        } };
        return new Proxy({}, { get: () => stub });
      } };
      vm.runInNewContext(outputText, context);
      const Component = context.exports[kind === 'experience' ? 'ExperienceSection' : 'EducationSection'];
      const props = { form, experienceFields: rows, educationFields: rows };
      const field = key => find(Component(props), element => element.props?.name === `${name}.0.${key}`);
      const countryField = field('country');
      const rendered = countryField.props.render({ field: { value: rows[0].country, onChange: value => { rows[0].country = value; } } });
      find(rendered, element => typeof element.props?.onChange === 'function').props.onChange('Canada');
      assert.equal(rows[0].country, 'Canada');
      assert.equal(rows[0].city, '');
      assert.equal(rows[1].city, 'London');
      assert.deepEqual(profile, { country: 'United Kingdom', city: 'London' });
      const city = field('city').props.render({ field: { value: rows[0].city, onChange() {} } });
      const options = find(city, element => Array.isArray(element.props?.options)).props.options;
      assert.equal(options[0].value, 'Toronto');
    });
  }
}

test('entry city queries follow their countries across profile changes, resets and removal', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  const observer = new QueriesObserver(client, []);
  const unsubscribe = observer.subscribe(() => {});
  let profileCountry = 'United Kingdom';
  let entries = [{ country: 'Nigeria' }, { country: 'Canada' }];
  const requests = [];
  let finishNigeria;
  const nigeria = new Promise(resolve => { finishNigeria = resolve; });
  const { outputText } = ts.transpileModule(
    fs.readFileSync(path.resolve(__dirname, '../hooks/use-resume-entry-cities.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  );
  const context = { exports: {}, process: { env: {} },
    fetch: async (url, options) => {
      const country = JSON.parse(options.body).country;
      requests.push(country);
      const cities = country === 'Nigeria' ? await nigeria : country === 'Canada' ? ['Toronto'] : ['London'];
      return { ok: true, json: async () => ({ data: cities }) };
    },
    require: name => name === 'react-hook-form'
      ? { useWatch: ({ name }) => { assert.ok(['experiences', 'educationList'].includes(name)); return entries; } }
      : { useQueries: ({ queries }) => { observer.setQueries(queries); return observer.getCurrentResult(); } },
  };
  vm.runInNewContext(outputText, context);
  const read = name => context.exports.useResumeEntryCities({ control: {} }, name);
  const tick = () => new Promise(resolve => setTimeout(resolve, 10));
  try {
    read('educationList');
    await tick();
    assert.deepEqual(requests, ['Nigeria', 'Canada']);
    assert.equal(read('educationList').loadingCities[0], true);
    profileCountry = 'France';
    read('experiences');
    assert.equal(requests.includes(profileCountry), false);
    entries = [{ country: 'United Kingdom' }, { country: 'Canada' }];
    read('educationList');
    await tick();
    assert.equal(read('educationList').citiesData[0][0], 'London');
    finishNigeria(['Lagos', 'Abuja']);
    await tick();
    assert.equal(read('educationList').citiesData[0][0], 'London', 'old response cannot replace the selected country');
    entries = [{ country: 'Canada' }];
    assert.equal(read('experiences').citiesData[0][0], 'Toronto', 'removing a row keeps cities tied to its country');
    entries = [{ country: '' }];
    assert.equal(read('experiences').citiesData[0].length, 0);
    assert.equal(read('experiences').loadingCities[0], false);
    entries = [{ country: 'Nigeria' }];
    assert.equal(read('educationList').citiesData[0][0], 'Lagos', 'saved values and drafts restore their own cities');
  } finally {
    finishNigeria(['Lagos']);
    unsubscribe();
    observer.destroy();
    client.clear();
  }
});
