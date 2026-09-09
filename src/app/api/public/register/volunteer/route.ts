import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getEmailProvider, volunteerApplicationReceivedTemplate } from '@/lib/email';

const volunteerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  district: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  education: z.string().optional().or(z.literal('')),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  contributionType: z.string().optional().or(z.literal('')),
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
        gender: data.gender || null,
        education: data.education || null,
        skills: data.skills || [],
        interests: data.interests || [],
        contributionType: data.contributionType || null,
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

    // Send Application Received email (Card is sent upon onboarding pipeline approval)
    if (newVolunteer.email) {
      try {
        const orgSetting = await prisma.orgSetting.findUnique({
          where: { key: 'org_name' },
        });

        const orgName = orgSetting?.value || 'Free Mind Foundation';
        const emailProvider = await getEmailProvider();
        const template = volunteerApplicationReceivedTemplate({
          name: newVolunteer.name,
          orgName,
        });

        await emailProvider.send({
          to: newVolunteer.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        });
      } catch (emailErr) {
        console.error('Failed to send public volunteer application email:', emailErr);
      }
    }

    return NextResponse.json({ success: true, volunteer: newVolunteer }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating volunteer:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
