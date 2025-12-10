import { PrismaClient } from '@prisma/client';
import { createWorkshop } from './actions/create-workshop';

// Prevent caching so new workshops appear immediately
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

async function getWorkshops() {
  return await prisma.workshop.findMany({
    orderBy: {
      workshopDate: 'desc',
    }, include: {
      _count: {
        select: { opportunities: true }
      }
    }
  });
}

import { NewWorkshopButton } from '@/components/workshop/NewWorkshopButton';
import { WorkshopCard } from '@/components/workshop/WorkshopCard';

export default async function Dashboard() {
  const workshops = await getWorkshops();

  return (
    <div className="min-h-screen bg-[var(--bg-core)] p-10">

      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy dark:text-white">Workshop Dashboard</h1>
          <p className="text-slate-500">Manage your strategic planning sessions</p>
        </div>

        <NewWorkshopButton />
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {workshops.map((workshop) => (
          <WorkshopCard key={workshop.id} workshop={workshop} />
        ))}

        {workshops.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400">
            <p>No workshops found. Start a new session above.</p>
          </div>
        )}

      </div>
    </div>
  );
}
