import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_INDIAN_STATES, DEFAULT_PIPELINE_STAGES, PipelineStageConfig } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const keys = [
      'volunteer_availabilities',
      'volunteer_skills',
      'volunteer_interests',
      'form_states',
      'form_districts',
      'form_genders',
      'form_educations',
      'volunteer_pipeline_stages',
      'org_logo',
      'org_name',
    ]

    const settings = await prisma.orgSetting.findMany({
      where: {
        key: {
          in: keys,
        },
      },
    })

    const result = {
      states: DEFAULT_INDIAN_STATES as string[],
      districts: {} as Record<string, string[]>,
      availabilities: [] as string[],
      skills: [] as string[],
      interests: [] as string[],
      genders: ['Male', 'Female', 'Other'] as string[],
      educations: ['High School', "Bachelor's Degree", "Master's Degree", "Doctorate"] as string[],
      pipelineStages: DEFAULT_PIPELINE_STAGES as PipelineStageConfig[],
      orgLogo: '',
      orgName: 'Free Mind Foundation',
    }

    settings.forEach((setting) => {
      try {
        if (setting.key === 'org_logo') {
          result.orgLogo = setting.value
        } else if (setting.key === 'org_name') {
          result.orgName = setting.value
        } else if (setting.key === 'form_districts') {
          const parsed = JSON.parse(setting.value)
          if (typeof parsed === 'object' && parsed !== null) {
            result.districts = parsed
          }
        } else {
          const parsed = JSON.parse(setting.value)
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (setting.key === 'form_states') result.states = parsed
            if (setting.key === 'form_genders') result.genders = parsed
            if (setting.key === 'form_educations') result.educations = parsed
            if (setting.key === 'volunteer_availabilities') result.availabilities = parsed
            if (setting.key === 'volunteer_skills') result.skills = parsed
            if (setting.key === 'volunteer_interests') result.interests = parsed
            if (setting.key === 'volunteer_pipeline_stages') result.pipelineStages = parsed
          }
        }
      } catch (e) {
        console.error(`Failed to parse setting for ${setting.key}`)
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching form options:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
