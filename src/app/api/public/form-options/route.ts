import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_INDIAN_STATES } from '@/lib/constants';

export async function GET() {
  try {
    const keys = ['volunteer_availabilities', 'volunteer_skills', 'volunteer_interests', 'form_states'];
    
    const settings = await prisma.orgSetting.findMany({
      where: {
        key: {
          in: keys
        }
      }
    });

    const result = {
      states: DEFAULT_INDIAN_STATES as string[],
      availabilities: [] as string[],
      skills: [] as string[],
      interests: [] as string[]
    };

    settings.forEach(setting => {
      try {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (setting.key === 'form_states') result.states = parsed;
          if (setting.key === 'volunteer_availabilities') result.availabilities = parsed;
          if (setting.key === 'volunteer_skills') result.skills = parsed;
          if (setting.key === 'volunteer_interests') result.interests = parsed;
        }
      } catch (e) {
        console.error(`Failed to parse setting for ${setting.key}`);
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching form options:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
