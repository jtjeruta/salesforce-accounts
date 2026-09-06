import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import Spinner from './Spinner';
import type { Account, AccountInput } from '../api';

type Mode = 'create' | 'edit' | 'delete';

type AccountModalProps = {
  mode: Mode;
  account?: Account | null;
  open: boolean;
  saving: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values?: AccountInput) => Promise<void> | void;
};

const EMPTY_FORM: AccountInput = {
  Name: '',
  Phone: '',
  Website: '',
};

export default function AccountModal({
  mode,
  account,
  open,
  saving,
  error,
  onClose,
  onSubmit,
}: AccountModalProps) {
  const initialValues = useMemo<AccountInput>(() => {
    if (!account) return EMPTY_FORM;

    return {
      Name: account.name || '',
      Phone: account.phone || '',
      Website: account.website || '',
    };
  }, [account]);

  const [values, setValues] = useState<AccountInput>(initialValues);

  useEffect(() => {
    if (open) {
      setValues(initialValues);
    }
  }, [initialValues, open]);

  if (!open) return null;

  const title =
    mode === 'create'
      ? 'Create account'
      : mode === 'edit'
      ? 'Edit account'
      : 'Delete account';

  const description =
    mode === 'delete'
      ? `This will permanently remove ${
          account?.name || 'this account'
        } from Salesforce.`
      : 'Manage the basic Salesforce account fields your API already supports.';

  const submitLabel =
    mode === 'create'
      ? 'Create account'
      : mode === 'edit'
      ? 'Save changes'
      : 'Delete account';

  const handleChange =
    (field: keyof AccountInput) => (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === 'delete') {
      await onSubmit();
      return;
    }

    await onSubmit({
      Name: values.Name.trim(),
      Phone: values.Phone?.trim() || '',
      Website: values.Website?.trim() || '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4">
      <form
        className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl shadow-stone-900/10"
        onSubmit={handleSubmit}
      >
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">
            Salesforce account
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-900">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {mode === 'delete' ? (
          <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-700">
            Account name:{' '}
            <span className="font-medium text-stone-900">{account?.name}</span>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Name
              </span>
              <input
                required
                value={values.Name}
                onChange={handleChange('Name')}
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                placeholder="Acme Corporation"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Phone
              </span>
              <input
                value={values.Phone}
                onChange={handleChange('Phone')}
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                placeholder="555-0100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Website
              </span>
              <input
                value={values.Website}
                onChange={handleChange('Website')}
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                placeholder="https://acme.example"
              />
            </label>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || (mode !== 'delete' && !values.Name.trim())}
            className="rounded-full bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 flex gap items-center"
          >
            {saving ? <Spinner /> : null}
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
