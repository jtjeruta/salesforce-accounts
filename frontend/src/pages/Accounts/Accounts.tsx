import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTanStackTableDevtools } from '@tanstack/react-table-devtools';
import {
  tableFeatures,
  useTable,
  type ColumnDef,
  createSortedRowModel,
  rowSortingFeature,
} from '@tanstack/react-table';

import { api, type Account, type AccountInput } from '../../api';
import AccountModal from '../../components/AccountModal';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import CheckCircleIcon from '../../components/CheckCircleIcon';
import './Accounts.css';

const PAGE_SIZE = 20;

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
});

const searchParams = new URLSearchParams(window.location.search);

export default function AccountsPage() {
  const [page, setPage] = useState(() => {
    const parsed = Number(searchParams.get('page'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { hostLabel, logout } = useAuth();
  const queryClient = useQueryClient();
  const [modalMode, setModalMode] = useState<
    'create' | 'edit' | 'delete' | null
  >(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const accountsQuery = useQuery<Account[], Error>({
    queryKey: ['accounts', page],
    queryFn: () =>
      api.listAccounts({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
  });

  const invalidateAccounts = () =>
    queryClient.invalidateQueries({ queryKey: ['accounts'] });

  useEffect(() => {
    if (!toastMessage) return undefined;

    const timeoutId = window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const createAccount = useMutation({
    mutationFn: api.createAccount,
    onSuccess: async () => {
      await invalidateAccounts();
      setToastMessage('Account created');
    },
  });

  const updateAccount = useMutation({
    mutationFn: ({ id, values }: { id: string; values: AccountInput }) =>
      api.updateAccount(id, values),
    onSuccess: async () => {
      await invalidateAccounts();
      setToastMessage('Account updated');
    },
  });

  const deleteAccount = useMutation({
    mutationFn: api.deleteAccount,
    onSuccess: async () => {
      await invalidateAccounts();
      setToastMessage('Account deleted');
    },
  });

  const resetModalMutations = useCallback(() => {
    createAccount.reset();
    updateAccount.reset();
    deleteAccount.reset();
  }, [createAccount, updateAccount, deleteAccount]);

  const activeMutation =
    modalMode === 'create'
      ? createAccount
      : modalMode === 'edit'
      ? updateAccount
      : modalMode === 'delete'
      ? deleteAccount
      : null;
  const modalError = activeMutation?.error?.message ?? null;
  const saving = activeMutation?.isPending ?? false;

  const closeModal = () => {
    resetModalMutations();
    setModalMode(null);
    setSelectedAccount(null);
  };

  const openCreate = () => {
    resetModalMutations();
    setSelectedAccount(null);
    setModalMode('create');
  };

  const openEdit = useCallback(
    (account: Account) => {
      resetModalMutations();
      setSelectedAccount(account);
      setModalMode('edit');
    },
    [resetModalMutations],
  );

  const openDelete = useCallback(
    (account: Account) => {
      resetModalMutations();
      setSelectedAccount(account);
      setModalMode('delete');
    },
    [resetModalMutations],
  );

  const handleModalSubmit = async (values?: AccountInput) => {
    try {
      if (modalMode === 'create' && values) {
        await createAccount.mutateAsync(values);
      } else if (modalMode === 'edit' && selectedAccount && values) {
        await updateAccount.mutateAsync({
          id: selectedAccount.id,
          values,
        });
      } else if (modalMode === 'delete' && selectedAccount) {
        await deleteAccount.mutateAsync(selectedAccount.id);
      }

      closeModal();
    } catch {
      // Keep the modal open so the active mutation error can be shown inline.
    }
  };

  const columns = useMemo<ColumnDef<typeof features, Account>[]>(
    () => [
      { header: 'Name', accessorKey: 'name' },
      { header: 'Website', accessorKey: 'website' },
      { header: 'Phone', accessorKey: 'phone' },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => openEdit(row.original)}
              className="rounded-md border border-stone-300 px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => openDelete(row.original)}
              className="rounded-md border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [openEdit, openDelete],
  );

  const table = useTable({
    key: 'accounts-table',
    features,
    columns,
    data: accountsQuery.data ?? [],
  });

  useTanStackTableDevtools(table);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      {toastMessage ? (
        <div className="fixed right-4 top-[150px] z-50">
          <div className="rounded-xl border border-none bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800 shadow-lg shadow-stone-900/10 animate-toast flex gap-2 items-center">
            <CheckCircleIcon /> {toastMessage}
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">
              Salesforce Accounts
            </h1>
            <p className="mt-2 text-sm text-stone-600">{hostLabel}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openCreate}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              New account
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              Disconnect
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-6 py-3 font-medium">
                    {header.isPlaceholder ? null : (
                      <div
                        style={{
                          cursor: header.column.getCanSort()
                            ? 'pointer'
                            : undefined,
                        }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <table.FlexRender header={header} />
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-stone-200">
            {accountsQuery.isPending ? (
              <>
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
              </>
            ) : accountsQuery.isError ? (
              <tr>
                <td
                  colSpan={table.getAllColumns().length}
                  className="px-6 py-4 text-center text-sm text-stone-500"
                >
                  Error loading accounts
                  <button
                    className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                    onClick={() => accountsQuery.refetch()}
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 text-stone-900">
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {!accountsQuery.isPending && !accountsQuery.isError ? (
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              setPage(page - 1);
              searchParams.set('page', (page - 1).toString());
              window.history.replaceState(
                null,
                '',
                `?${searchParams.toString()}`,
              );
            }}
            disabled={page === 1}
          >
            Prev
          </button>
          <button
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              setPage(page + 1);
              searchParams.set('page', (page + 1).toString());
              window.history.replaceState(
                null,
                '',
                `?${searchParams.toString()}`,
              );
            }}
            disabled={PAGE_SIZE > accountsQuery.data.length}
          >
            Next
          </button>
        </div>
      ) : null}

      <AccountModal
        open={Boolean(modalMode)}
        mode={modalMode || 'create'}
        account={selectedAccount}
        saving={saving}
        error={modalError}
        onClose={() => {
          if (!saving) closeModal();
        }}
        onSubmit={handleModalSubmit}
      />
    </main>
  );
}

function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-6 py-4">
        <div className="h-4 w-full animate-pulse rounded-md bg-stone-200" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-full animate-pulse rounded-md bg-stone-200" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-full animate-pulse rounded-md bg-stone-200" />
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2 justify-end">
          <div className="h-6 w-12 animate-pulse rounded-md bg-stone-200" />
          <div className="h-6 w-18 animate-pulse rounded-md bg-stone-200" />
        </div>
      </td>
    </tr>
  );
}
