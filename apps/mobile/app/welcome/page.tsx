"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function fieldValue(value: string | null): string {
  return value && value.trim() ? value : "Not available";
}

function FieldCard({
  label,
  value,
  mono,
  wide,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
        {label}
      </p>
      <p
        className={`mt-1 break-all text-[15px] font-semibold text-slate-900 ${
          mono ? "font-mono text-[14px]" : ""
        }`}
      >
        {fieldValue(value)}
      </p>
    </div>
  );
}

function WelcomeContent() {
  const searchParams = useSearchParams();

  const name = searchParams.get("name");
  const userId = searchParams.get("user_id");
  const openId = searchParams.get("open_id");
  const employeeId = searchParams.get("employee_id");
  const email = searchParams.get("email");
  const department = searchParams.get("department");
  const avatar = searchParams.get("avatar");

  return (
    <div className="min-h-screen bg-slate-200/80 px-3 py-6 text-slate-900 antialiased">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200/80 bg-slate-100/90 shadow-xl shadow-slate-300/30 ring-1 ring-slate-900/5">
        <div className="px-5 py-8">
          <div className="flex flex-col items-center text-center">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg ring-2 ring-slate-200"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-200 text-4xl text-slate-500">
                ?
              </div>
            )}
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
              Welcome Back
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              {fieldValue(name)}
            </h1>
            <span className="mt-4 inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              Spacify OS Authenticated
            </span>
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Account Information
            </h2>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600">
              Secure Session
            </span>
          </div>

          <dl className="grid gap-3 md:grid-cols-2">
            <FieldCard label="Name" value={name} />
            <FieldCard label="User ID" value={userId} mono />
            <FieldCard label="Employee ID" value={employeeId} />
            <FieldCard label="Department" value={department} />
            <FieldCard label="Email" value={email} />
            <FieldCard label="Open ID" value={openId} mono wide />
          </dl>
        </div>
      </div>
    </div>
  );
}

function WelcomeFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">
      <p className="text-base font-medium">Loading…</p>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<WelcomeFallback />}>
      <WelcomeContent />
    </Suspense>
  );
}
