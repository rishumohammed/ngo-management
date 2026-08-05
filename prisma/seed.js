/**
 * Prisma Seed Script (CommonJS for direct Node execution)
 * Creates the initial Super Admin user and default org settings.
 * Run: node prisma/seed.js
 *
 * Default credentials:
 *   Email: admin@freemindfoundation.org.in
 *   Password: Admin@FMF2024
 *   (Change immediately after first login!)
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const DEFAULT_INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
]

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding FMF Trust Management database...')

  // Create Super Admin
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@freemindfoundation.org.in' },
  })

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@FMF2024', 12)
    await prisma.user.create({
      data: {
        email: 'admin@freemindfoundation.org.in',
        name: 'Super Admin',
        passwordHash,
        role: 'SUPER_ADMIN',
      },
    })
    console.log('✅ Created Super Admin: admin@freemindfoundation.org.in / Admin@FMF2024')
  } else {
    console.log('ℹ️  Super Admin already exists — skipping creation')
  }

  // Seed default org settings
  const defaults = {
    org_name: 'Free Mind Foundation',
    org_address: '',
    org_pan: '',
    eighty_g_number: '',
    eighty_g_validity: '',
    fcra_number: '',
    signatory_name: '',
    receipt_prefix: 'FMF',
    fy_start_month: '4',
    email_provider: 'brevo',
    email_api_key: '',
    email_from: 'no-reply@freemindfoundation.org.in',
    email_from_name: 'Free Mind Foundation',
    form_states: JSON.stringify(DEFAULT_INDIAN_STATES),
  }

  for (const [key, value] of Object.entries(defaults)) {
    await prisma.orgSetting.upsert({
      where: { key },
      create: { key, value },
      update: {}, // Don't overwrite existing values
    })
  }
  console.log('✅ Default org settings seeded')

  console.log('\n🎉 Database ready!')
  console.log('   Super Admin: admin@freemindfoundation.org.in')
  console.log('   Password: Admin@FMF2024')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
