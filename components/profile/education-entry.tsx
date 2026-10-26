import { GraduationCap } from "lucide-react";

export function EducationEntry({ institution, qualification, field, dates }: {
  institution?: string; qualification?: string; field?: string; dates: string;
}) {
  return <div className="flex items-start gap-4 border-b border-gray-200 bg-white py-5 last:border-b-0">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-gray-100 sm:h-14 sm:w-14">
      <GraduationCap aria-hidden="true" className="h-7 w-7 text-gray-500" />
    </div>
    <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
      <h4 className="text-lg font-semibold leading-snug text-gray-900">{institution?.trim() || "Institution not provided"}</h4>
      {(qualification || field) && <p className="mt-0.5 text-base leading-snug text-gray-800">{[qualification, field].filter(value => value?.trim()).join(", ")}</p>}
      {dates && <p className="mt-1 text-sm text-gray-500">{dates}</p>}
    </div>
  </div>;
}
