'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteKid } from '@/app/actions/admin-actions';

export default function DeleteKidButton({ kidId, kidName }: { kidId: number; kidName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const remove = () => {
    if (!confirm(`Remove ${kidName} and their list? This can't be undone.`)) return;
    startTransition(async () => {
      await deleteKid(kidId);
      router.push('/admin/kids');
      router.refresh();
    });
  };

  return (
    <button type="button" className="btn-ghost py-2 text-sm text-cran-600" disabled={pending} onClick={remove}>
      🗑️ Remove
    </button>
  );
}
