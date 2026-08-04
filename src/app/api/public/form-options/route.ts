import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_INDIAN_STATES, DEFAULT_PIPELINE_STAGES, PipelineStageConfig } from '@/lib/constants'

export async function GET() {
  try {
    const keys = [
      'volunteer_availabilities',
      'volunteer_skills',
      'volunteer_interests',
      'form_states',
      'volunteer_pipeline_stages',
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
      availabilities: [] as string[],
      skills: [] as string[],
      interests: [] as string[],
      pipelineStages: DEFAULT_PIPELINE_STAGES as PipelineStageConfig[],
    }

    settings.forEach((setting) => {
      try {
        const parsed = JSON.parse(setting.value)
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (setting.key === 'form_states') result.states = parsed
          if (setting.key === 'volunteer_availabilities') result.availabilities = parsed
          if (setting.key === 'volunteer_skills') result.skills = parsed
          if (setting.key === 'volunteer_interests') result.interests = parsed
          if (setting.key === 'volunteer_pipeline_stages') result.pipelineStages = parsed
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
