import { useState } from 'react';
import Spinner from '../components/Spinner';
const searchParams = new URLSearchParams(window.location.search);

export default function LoginPage() {
  const errorMessage = searchParams.get('error');
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    window.location.href = '/oauth/login';
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4">
      <section className="w-full rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-stone-900">
          Salesforce Accounts
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Connect to Salesforce to view and manage Account records.
        </p>

        {errorMessage ? (
          <div className="mt-3 text-sm text-red-500">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium !text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 flex gap items-center"
          >
            {connecting ? <Spinner /> : null}
            Connect to Salesforce
          </button>
        </div>
      </section>
    </main>
  );
}
