import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const CURRENT_YEAR = new Date().getFullYear();

const PLACEHOLDER_KIDS = [
  { name: 'Jessie', avatar: '🦖', color: '#0f766e' },
  { name: 'Annie', avatar: '🌸', color: '#b42336' },
  { name: 'Marcie', avatar: '🐨', color: '#7c3aed' },
  { name: 'Kenlee', avatar: '🐬', color: '#0ea5e9' },
  { name: 'Ryder', avatar: '🚗', color: '#d97706' },
  { name: 'Harper', avatar: '🦄', color: '#db2777' },
];

async function main() {
  const yearCount = await prisma.year.count();
  if (yearCount > 0) {
    console.log('Seeding skipped: database already has years.');
    return;
  }

  const year = await prisma.year.create({
    data: { year: CURRENT_YEAR, isCurrent: true },
  });

  await prisma.kid.createMany({
    data: PLACEHOLDER_KIDS.map((k, i) => ({
      yearId: year.id,
      name: k.name,
      avatar: k.avatar,
      color: k.color,
      position: i,
    })),
  });

  await prisma.activity.create({
    data: {
      actor: 'System',
      action: 'Year started',
      detail: `${CURRENT_YEAR} season initialized with ${PLACEHOLDER_KIDS.length} placeholder kids.`,
    },
  });

  console.log(`Seeded ${CURRENT_YEAR} with ${PLACEHOLDER_KIDS.length} kids.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
