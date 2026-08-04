import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const volunteerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  availability: z.string().optional().or(z.literal('')),
  motivation: z.string().optional().or(z.literal('')),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = volunteerSchema.parse(body);

    // Check if email is already in use by another volunteer
    const existingVolunteer = await prisma.volunteer.findUnique({
      where: { email: data.email },
    });

    if (existingVolunteer) {
      return NextResponse.json({ success: false, message: 'Email already registered as a volunteer' }, { status: 409 });
    }

    const newVolunteer = await prisma.volunteer.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        skills: data.skills || [],
        interests: data.interests || [],
        availability: data.availability || null,
        motivation: data.motivation || null,
        currentStage: 'APPLICATION',
      },
    });

    // Create the initial stage record
    await prisma.volunteerStage.create({
      data: {
        volunteerId: newVolunteer.id,
        stage: 'APPLICATION',
        status: 'PENDING',
        notes: 'Submitted via public form',
      },
    });

    return NextResponse.json({ success: true, volunteer: newVolunteer }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating volunteer:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
