import prisma from '../src/lib/prisma';

console.log('Prisma keys:', Object.keys(prisma));
console.log('Prisma user model:', (prisma as any).user);
console.log('Prisma role model:', (prisma as any).role);
