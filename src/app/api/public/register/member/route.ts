import { NextResponse } from 'next/server';
import { PrismaClient, MembershipType } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';

const prisma = new PrismaClient();

const memberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  membershipType: z.nativeEnum(MembershipType).default(MembershipType.GENERAL),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = memberSchema.parse(body);

    // Generate a unique member number (FMF-M-YYMM-RANDOM)
    const datePrefix = new Date().toISOString().slice(2, 7).replace('-', '');
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const memberNumber = `FMF-M-${datePrefix}-${randomSuffix}`;

    const newMember = await prisma.member.create({
      data: {
        memberNumber,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        membershipType: data.membershipType,
        joinDate: new Date(),
        status: 'ACTIVE',
        notes: 'Registered via public form',
      },
    });

    return NextResponse.json({ success: true, member: newMember }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating member:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
