export type BadgeShape = 'PENTAGON' | 'DIAMOND_RIBBON' | 'CORAL_DIAMOND';

export type AchievementCategory = 'LEVEL' | 'MILESTONE' | 'SPECIALTY';

export interface AgentAchievement {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  category: AchievementCategory;
  shape: BadgeShape;
  iconName: string; // Ionicons name
  badgeText?: string; // e.g. 'L1', 'L2', 'L3', '10+', '25+', '50+'
  gradient: [string, string];
  accentColor: string;
  ribbonColor?: string;
  awardedAt: string; // ISO date
  awardedBy: string; // e.g. 'Aarav Mehta (Admin)'
}

export interface AchievementTemplate {
  code: string;
  title: string;
  subtitle: string;
  description: string;
  category: AchievementCategory;
  shape: BadgeShape;
  iconName: string;
  badgeText?: string;
  gradient: [string, string];
  accentColor: string;
  ribbonColor?: string;
}

// Full catalog of badges matching reference image media_1794855940141_5e52913d.jpg
export const ACHIEVEMENT_CATALOG: AchievementTemplate[] = [
  // 1. Pentagon Level Badges (Icy Blue / Cosmic Theme)
  {
    code: 'LEVEL_1',
    title: 'Level 1 Apprentice',
    subtitle: 'Initiation into Studio Shoots',
    description: 'Awarded by Admin for mastering studio protocols, gear handling, and baseline ceremony etiquette.',
    category: 'LEVEL',
    shape: 'PENTAGON',
    iconName: 'planet-outline',
    badgeText: 'L1',
    gradient: ['#60A5FA', '#2563EB'],
    accentColor: '#93C5FD',
  },
  {
    code: 'LEVEL_2',
    title: 'Level 2 Pro Shooter',
    subtitle: 'Multi-Day Event Specialist',
    description: 'Awarded by Admin for rock-solid consistency across multi-day destination weddings without supervision.',
    category: 'LEVEL',
    shape: 'PENTAGON',
    iconName: 'rocket',
    badgeText: 'L2',
    gradient: ['#38BDF8', '#0284C7'],
    accentColor: '#BAE6FD',
  },
  {
    code: 'LEVEL_3',
    title: 'Level 3 Elite Lead',
    subtitle: 'Master Crew Director',
    description: 'Awarded by Admin to premier leads trusted with flagship grand weddings, VVIP clients, and team direction.',
    category: 'LEVEL',
    shape: 'PENTAGON',
    iconName: 'sparkles',
    badgeText: 'L3',
    gradient: ['#818CF8', '#4F46E5'],
    accentColor: '#C7D2FE',
  },

  // 2. Diamond Ribbon Milestone Badges (Warm Golden Amber with Ribbon)
  {
    code: 'SHOOTS_10',
    title: '10+ Shoots Club',
    subtitle: '10 Completed Weddings',
    description: 'Awarded by Admin upon successfully completing 10 full-length wedding assignments.',
    category: 'MILESTONE',
    shape: 'DIAMOND_RIBBON',
    iconName: 'ribbon-outline',
    badgeText: '10+',
    gradient: ['#FBBF24', '#D97706'],
    accentColor: '#FEF3C7',
    ribbonColor: '#EF4444',
  },
  {
    code: 'SHOOTS_25',
    title: '25+ Shoots Veteran',
    subtitle: '25 Flawless Weddings',
    description: 'Awarded by Admin for achieving 25 verified shoots with zero material loss and 100% attendance.',
    category: 'MILESTONE',
    shape: 'DIAMOND_RIBBON',
    iconName: 'ribbon-outline',
    badgeText: '25+',
    gradient: ['#F59E0B', '#B45309'],
    accentColor: '#FFFBEB',
    ribbonColor: '#DC2626',
  },
  {
    code: 'SHOOTS_50',
    title: '50+ Shoots Legend',
    subtitle: '50+ Elite Grand Weddings',
    description: 'Awarded by Admin for crossing 50 grand wedding productions as a core studio pillar.',
    category: 'MILESTONE',
    shape: 'DIAMOND_RIBBON',
    iconName: 'trophy',
    badgeText: '50+',
    gradient: ['#F59E0B', '#92400E'],
    accentColor: '#FEF08A',
    ribbonColor: '#B91C1C',
  },

  // 3. Coral Rounded Diamond Specialty Badges (Warm Red/Pink Aperture & Camera Icons)
  {
    code: 'EXPLORER',
    title: 'Master Shutter',
    subtitle: 'Aperture & Framing Wizard',
    description: 'Awarded by Admin for exceptional depth of field control, golden-hour portraits, and artistic framing.',
    category: 'SPECIALTY',
    shape: 'CORAL_DIAMOND',
    iconName: 'aperture',
    badgeText: 'CAM',
    gradient: ['#F87171', '#DC2626'],
    accentColor: '#FEE2E2',
  },
  {
    code: 'REMIXER',
    title: 'Reel Maestro',
    subtitle: 'Viral 9:16 Storytelling',
    description: 'Awarded by Admin for crafting high-energy Instagram reels, gimbal movements, and beat-synced motion.',
    category: 'SPECIALTY',
    shape: 'CORAL_DIAMOND',
    iconName: 'sync-circle',
    badgeText: 'REEL',
    gradient: ['#FB7185', '#E11D48'],
    accentColor: '#FFE4E6',
  },
  {
    code: 'WORDSMITH',
    title: 'Emotional Storyteller',
    subtitle: 'Vows & Candid Whisperer',
    description: 'Awarded by Admin for capturing heartfelt emotional moments, tearful parents, and candid laughter.',
    category: 'SPECIALTY',
    shape: 'CORAL_DIAMOND',
    iconName: 'heart',
    badgeText: 'RAW',
    gradient: ['#F43F5E', '#BE123C'],
    accentColor: '#FFF1F2',
  },
  {
    code: 'SPEED_DEMON',
    title: 'Same-Day Rush Ace',
    subtitle: 'Express Media Submission',
    description: 'Awarded by Admin for consistently backing up raw footage and delivering teaser cuts within 6 hours.',
    category: 'SPECIALTY',
    shape: 'CORAL_DIAMOND',
    iconName: 'flash',
    badgeText: 'FAST',
    gradient: ['#FB923C', '#EA580C'],
    accentColor: '#FFEDD5',
  },
];
