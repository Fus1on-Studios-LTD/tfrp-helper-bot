require('dotenv').config();
const prisma = require('./src/lib/prisma');

async function main() {
  const result = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  console.log('Database connection successful.');
  console.log(result);
}

main()
  .catch((error) => {
    console.error('Database test failed:');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
