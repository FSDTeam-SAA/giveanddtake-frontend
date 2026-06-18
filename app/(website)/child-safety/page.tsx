import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  Eye,
  FileCheck,
  Flag,
  Gavel,
  type LucideIcon,
  Mail,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Child Safety Standards | Elevator Video Pitch",
  description:
    "Child safety standards and CSAE compliance policy for Elevator Video Pitch.",
  alternates: {
    canonical: "/child-safety",
  },
};

const monitoringItems = [
  "Automated and manual moderation systems are used to detect harmful content.",
  "Content violating child safety rules is immediately removed.",
  "Accounts involved in violations are permanently banned.",
];

const enforcementItems = [
  "Immediate removal of violating content",
  "Account suspension or permanent ban",
  "Internal investigation of reported behavior",
];

export default function ChildSafetyPage() {
  return (
    <main className="bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 lg:py-24">
          <div className="flex flex-col items-start gap-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-600 text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
              </span>
              Child Safety &amp; CSAE Compliance Policy
            </div>

            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 md:text-5xl lg:text-6xl">
              Child Safety Standards
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg md:leading-8">
              This document describes the child safety standards and protections
              implemented in our application to prevent child sexual abuse and
              exploitation (CSAE) and ensure compliance with applicable laws and
              platform policies.
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                Zero tolerance enforcement
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                24/7 content moderation
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                Law enforcement cooperation
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <article className="space-y-5">
            <PolicySection
              number="1"
              title="Zero Tolerance Policy"
              icon={ShieldAlert}
              tone="critical"
            >
              <p>
                We maintain a strict zero-tolerance policy against any form of
                child sexual abuse material (CSAM), child exploitation, grooming,
                or any harmful behavior involving minors.
              </p>
            </PolicySection>

            <PolicySection
              number="2"
              title="User-Generated Content Monitoring"
              icon={Eye}
            >
              <PolicyList items={monitoringItems} />
            </PolicySection>

            <PolicySection number="3" title="Reporting Mechanism" icon={Flag}>
              <p>
                Users can report any suspicious or harmful activity directly
                within the app using the reporting feature. Reports are reviewed
                promptly by our safety team.
              </p>
            </PolicySection>

            <PolicySection number="4" title="Enforcement Actions" icon={Gavel}>
              <PolicyList items={enforcementItems} />
            </PolicySection>

            <PolicySection
              number="5"
              title="Compliance with Law Enforcement"
              icon={Scale}
            >
              <p>
                We comply with all applicable child protection laws and cooperate
                with regional and national law enforcement agencies when
                required.
              </p>
            </PolicySection>

            <PolicySection
              number="6"
              title="Contact for Safety Concerns"
              icon={Mail}
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p>
                  <strong className="font-semibold text-slate-950">
                    Safety Contact Email:
                  </strong>{" "}
                  <a
                    href="mailto:iemmanuel@evpitch.com"
                    className="font-medium text-sky-700 underline-offset-4 hover:underline"
                  >
                    iemmanuel@evpitch.com
                  </a>
                </p>
                <p className="mt-3">
                  This contact is responsible for handling child safety and
                  CSAM-related concerns.
                </p>
              </div>
            </PolicySection>

            <PolicySection number="7" title="Policy Updates" icon={RefreshCw}>
              <p>
                This policy may be updated periodically to reflect new legal or
                platform requirements.
              </p>
            </PolicySection>
          </article>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-br from-sky-600 to-sky-700 p-6 text-white">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/20">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-100">
                  Safety Contact
                </p>
                <h2 className="mt-2 text-xl font-bold">
                  Report Child Safety Concerns
                </h2>
              </div>
              <div className="p-6">
                <p className="text-sm leading-6 text-slate-600">
                  This contact is responsible for handling child safety and
                  CSAM-related concerns.
                </p>
                <a
                  href="mailto:iemmanuel@evpitch.com"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  iemmanuel@evpitch.com
                </a>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <FileCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Policy Status
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-sm font-medium text-emerald-700">Active</p>
              </div>
              <p className="mt-3 text-base font-semibold text-slate-950">
                Last updated
              </p>
              <p className="text-sm text-slate-600">2026-06-18</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function PolicyList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 flex-none text-emerald-600"
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PolicySection({
  number,
  title,
  icon: Icon,
  tone = "default",
  children,
}: {
  number: string;
  title: string;
  icon: LucideIcon;
  tone?: "default" | "critical";
  children: ReactNode;
}) {
  const isCritical = tone === "critical";

  return (
    <section
      className={[
        "group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md md:p-8",
        isCritical
          ? "border-rose-200 hover:border-rose-300"
          : "border-slate-200 hover:border-sky-300",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "absolute inset-y-0 left-0 w-1",
          isCritical ? "bg-rose-500" : "bg-sky-500",
        ].join(" ")}
      />

      <div className="mb-4 flex items-center gap-3">
        <span
          className={[
            "flex h-10 w-10 flex-none items-center justify-center rounded-xl",
            isCritical
              ? "bg-rose-50 text-rose-600"
              : "bg-sky-50 text-sky-700",
          ].join(" ")}
        >
          <Icon className="h-5 w-5" aria-hidden={true} />
        </span>
        <div>
          <p
            className={[
              "text-xs font-semibold uppercase tracking-wide",
              isCritical ? "text-rose-500" : "text-slate-400",
            ].join(" ")}
          >
            Section {number}
          </p>
          <h2 className="text-xl font-bold text-slate-950 md:text-2xl">
            {title}
          </h2>
        </div>
      </div>
      <div className="text-base leading-7 text-slate-600">{children}</div>
    </section>
  );
}
