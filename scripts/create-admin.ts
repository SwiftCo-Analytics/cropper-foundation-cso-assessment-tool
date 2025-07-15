import { PrismaClient } from '../src/generated/prisma';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Please provide email and password as arguments');
    process.exit(1);
  }

  try {
    const hashedPassword = await hash(password, 12);
    
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Admin',
      },
    });

    console.log('Admin user created successfully:', admin.email);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 