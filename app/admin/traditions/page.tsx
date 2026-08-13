import { prisma } from '@/lib/prisma';
import { getCurrentYear } from '@/lib/year';
import TraditionEditor from '@/components/TraditionEditor';

export default async function TraditionsPage() {
  const year = await getCurrentYear();
  const traditions = year
    ? await prisma.tradition.findMany({ where: { yearId: year.id }, orderBy: { day: 'asc' } })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-pine-900">12 Days Board</h1>
        <p className="text-ink-soft">
          Fill in one activity per day. Cards unlock automatically each day from Dec 13 to Dec 24 for
          the whole family. The public board lives on the <a href="/" target="_blank" className="underline text-pine-700">homepage</a>.
        </p>
      </div>
      <TraditionEditor
        year={year?.year ?? new Date().getFullYear()}
        traditions={traditions.map((t) => ({
          day: t.day,
          title: t.title,
          description: t.description,
          photoUrl: t.photoUrl,
        }))}
      />
    </div>
  );
}
