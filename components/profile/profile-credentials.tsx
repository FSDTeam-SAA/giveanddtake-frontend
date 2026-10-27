import { Award } from "lucide-react";
import { credentialNames, profileAwards } from "@/lib/profile-credentials";
import { sortAwards, formatProfileDate } from "@/lib/profile-history";

export function ProfileCredentials({ certifications, languages, awards }: {
  certifications?: unknown; languages?: unknown; awards?: unknown;
}) {
  const savedAwards = sortAwards(profileAwards(awards));
  return <div className="min-w-0" data-profile-credentials>
    {[{ title: "Certifications", items: credentialNames(certifications) },
      { title: "Languages", items: credentialNames(languages) }].map(({ title, items }) => items.length > 0 && (
      <section key={title} className="border-b border-gray-200 py-6">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">{title}</h3>
        <ul className="flex flex-wrap gap-2">
          {items.map((name, index) => <li key={index} className="max-w-full rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900 [overflow-wrap:anywhere]">{name}</li>)}
        </ul>
      </section>
    ))}
    {savedAwards.length > 0 && <section className="border-b border-gray-200 py-6">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">Awards &amp; Honours</h3>
      <ul className="space-y-5">
        {savedAwards.map((award, index) => <li key={award._id || index} className="flex items-start gap-4">
          <div className="shrink-0 rounded-lg bg-blue-50 p-3"><Award className="h-6 w-6 text-blue-600" aria-hidden="true" /></div>
          <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
            {award.title && <h4 className="font-semibold text-gray-800">{award.title}</h4>}
            {(award.programeName || award.programName) && <p className="text-sm text-gray-600">{award.programeName || award.programName}</p>}
            {award.programeDate && <p className="text-sm text-gray-500">{formatProfileDate(award.programeDate)}</p>}
            {award.description && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{award.description}</p>}
          </div>
        </li>)}
      </ul>
    </section>}
  </div>;
}
