"use client";
import { InfoRow } from "@lark-sso/ui";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function WelcomeContent() {
  const searchParams = useSearchParams();

  const name = searchParams.get("name");
  const enName = searchParams.get("en_name");
  const userId = searchParams.get("user_id");
  const openId = searchParams.get("open_id");
  const employeeId = searchParams.get("employee_id");
  const email = searchParams.get("email");
  const department = searchParams.get("department");
  const avatar = searchParams.get("avatar");

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 via-slate-50 to-white text-slate-900 antialiased">
      <div className="mx-auto max-w-md px-3 pb-10 pt-8">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/50 ring-1 ring-slate-900/5">
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
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-2 text-lg font-semibold leading-snug text-indigo-600">
              {name || "User"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Signed in with Spacify OS
            </p>
          </div>

          <dl className="mt-6 space-y-0 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/80">
            <InfoRow
              label="Display name"
              value={name}
              className="min-h-[52px] py-4"
            />
            <InfoRow
              label="English name"
              value={enName}
              className="min-h-[52px] py-4"
            />
            <InfoRow
              label="User ID"
              value={userId}
              mono
              className="min-h-[52px] py-4"
            />
            <InfoRow
              label="Open ID"
              value={openId}
              mono
              className="min-h-[52px] py-4"
            />
            <InfoRow
              label="Employee ID"
              value={employeeId}
              className="min-h-[52px] py-4"
            />
            <InfoRow
              label="Email"
              value={email}
              className="min-h-[52px] py-4"
            />
            <InfoRow
              label="Department"
              value={department}
              className="min-h-[52px] py-4"
            />
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
