"use client";

import { useQuotes } from "@/lib/quote-context";

export default function SettingsPage() {
  const { user, signOut } = useQuotes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Account</p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm max-w-lg space-y-4">
        <div>
          <div className="text-sm text-gray-500">Signed in as</div>
          <div className="font-medium text-gray-900">{user?.email || "—"}</div>
        </div>
        <button
          onClick={() => signOut()}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
