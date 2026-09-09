import { NextResponse } from 'next/server';
import { MembershipType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import { generateMembershipCardPdf } from '@/lib/pdf/membershipCard';
import { getEmailProvider, membershipWelcomeTemplate } from '@/lib/email';

const memberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  district: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  education: z.string().optional().or(z.literal('')),
  membershipType: z.nativeEnum(MembershipType).optional().default(MembershipType.GENERAL),
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
        district: data.district || null,
        state: data.state || null,
        gender: data.gender || null,
        education: data.education || null,
        membershipType: data.membershipType,
        joinDate: new Date(),
        status: 'ACTIVE',
        notes: 'Registered via public form',
      },
    });

    // Send Membership Card via email if email provided
    if (newMember.email) {
      try {
        const orgSettingsList = await prisma.orgSetting.findMany({
          where: {
            key: { in: ['org_name', 'org_logo', 'org_signature', 'org_qr_code', 'signatory_name', 'signatory_title'] },
          },
        });

        const orgData = {
          orgName: orgSettingsList.find((s) => s.key === 'org_name')?.value || 'Free Mind Foundation',
          orgLogo: orgSettingsList.find((s) => s.key === 'org_logo')?.value || undefined,
          orgSignature: orgSettingsList.find((s) => s.key === 'org_signature')?.value || undefined,
          orgQrCode: orgSettingsList.find((s) => s.key === 'org_qr_code')?.value || undefined,
          signatory: orgSettingsList.find((s) => s.key === 'signatory_name')?.value || 'Authorised Signatory',
          signatoryTitle: orgSettingsList.find((s) => s.key === 'signatory_title')?.value || undefined,
        };

        const pdfBuffer = await generateMembershipCardPdf({ member: newMember, orgData });
        const emailProvider = await getEmailProvider();
        const template = membershipWelcomeTemplate({
          memberName: newMember.name,
          memberNumber: newMember.memberNumber,
          orgName: orgData.orgName,
        });

        await emailProvider.send({
          to: newMember.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
          attachments: [
            {
              filename: `Membership_Card_${newMember.memberNumber}.pdf`,
              content: Buffer.from(pdfBuffer),
              contentType: 'application/pdf',
            },
          ],
        });
      } catch (emailErr) {
        console.error('Failed to send public member card email:', emailErr);
      }
    }

    return NextResponse.json({ success: true, member: newMember }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating member:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
