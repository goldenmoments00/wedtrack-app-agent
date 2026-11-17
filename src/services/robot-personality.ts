export type MessageCategory =
  | 'welcome'
  | 'work_reminder'
  | 'funny_office'
  | 'boss'
  | 'motivation'
  | 'break'
  | 'achievement'
  | 'no_tasks'
  | 'agent_shoot';

export interface RobotMessage {
  id: string;
  category: MessageCategory;
  text: string;
}

export const ROBOT_MESSAGES: RobotMessage[] = [
  // 1. Welcome Messages
  { id: 'w1', category: 'welcome', text: 'Good Morning! Let\'s shine today.' },
  { id: 'w2', category: 'welcome', text: "Ready for today's shoot & edits?" },
  { id: 'w3', category: 'welcome', text: 'Hope today becomes another productive day.' },
  { id: 'w4', category: 'welcome', text: "Let's create beautiful wedding memories today." },
  { id: 'w5', category: 'welcome', text: 'Welcome back to Golden Moments!' },
  { id: 'w6', category: 'welcome', text: "Today's timeline & call sheet are waiting." },
  { id: 'w7', category: 'welcome', text: 'Shuprobhat! Ready to rock?' },
  { id: 'w8', category: 'welcome', text: 'New day, new golden captures.' },
  { id: 'w9', category: 'welcome', text: "Let's make some magic today." },
  { id: 'w10', category: 'welcome', text: 'Welcome! Cholo kaj shuru kori.' },
  { id: 'w11', category: 'welcome', text: "Kemon acho ajke? Let's start." },
  { id: 'w12', category: 'welcome', text: 'Another day to be creative.' },
  { id: 'w13', category: 'welcome', text: 'Good Afternoon! Energy ache to?' },
  { id: 'w14', category: 'welcome', text: "Shuvo bikel! Let's wrap up strong." },
  { id: 'w15', category: 'welcome', text: 'Evening shoots & edits are the best!' },
  { id: 'w16', category: 'welcome', text: 'Ah, exactly who I wanted to see!' },
  { id: 'w17', category: 'welcome', text: 'Fresh coffee, fresh lens!' },
  { id: 'w18', category: 'welcome', text: "Let's bring these moments to life." },

  // 2. Agent Shoot Specific
  { id: 'ag1', category: 'agent_shoot', text: 'Camera batteries 100% charged to?' },
  { id: 'ag2', category: 'agent_shoot', text: 'SD card format kore backup niyecho?' },
  { id: 'ag3', category: 'agent_shoot', text: 'Sindoor daan moment miss koro na!' },
  { id: 'ag4', category: 'agent_shoot', text: 'Lenses clean ache to?' },
  { id: 'ag5', category: 'agent_shoot', text: 'Bride entry shot cinematic nio!' },
  { id: 'ag6', category: 'agent_shoot', text: 'Audio mic battery check korecho?' },
  { id: 'ag7', category: 'agent_shoot', text: 'Gimbal balance thik ache?' },
  { id: 'ag8', category: 'agent_shoot', text: 'Golden hour lighting capture koro!' },

  // 3. Work Reminder
  { id: 'wr1', category: 'work_reminder', text: 'Kaj koro... timeline wait korche.' },
  { id: 'wr2', category: 'work_reminder', text: 'Mon diye edit koro.' },
  { id: 'wr3', category: 'work_reminder', text: 'Project ta ajkei sesh korbo?' },
  { id: 'wr4', category: 'work_reminder', text: 'Timeline ta check kore nao.' },
  { id: 'wr5', category: 'work_reminder', text: 'Export korar age ekbar review kore nio.' },
  { id: 'wr6', category: 'work_reminder', text: 'Ctrl + S dite bhulo na!' },
  { id: 'wr7', category: 'work_reminder', text: 'Color correction bhalo kore dekhbe.' },
  { id: 'wr8', category: 'work_reminder', text: 'Audio sync thik ache to?' },
  { id: 'wr9', category: 'work_reminder', text: "Don't forget the transitions." },
  { id: 'wr10', category: 'work_reminder', text: 'Backup rakhte bhulbe na.' },
  { id: 'wr11', category: 'work_reminder', text: 'Time is ticking, keep creating!' },
  { id: 'wr12', category: 'work_reminder', text: 'Focus! Focus!' },
  { id: 'wr13', category: 'work_reminder', text: 'Deadline kintu kache.' },

  // 4. Funny Office
  { id: 'f1', category: 'funny_office', text: 'Bou er kotha vabcho naki? 😂' },
  { id: 'f2', category: 'funny_office', text: 'Prem pore hobe... age edit koro! 😉' },
  { id: 'f3', category: 'funny_office', text: 'Coffee sesh? Abar ek cup?' },
  { id: 'f4', category: 'funny_office', text: 'Timeline e fire asho.' },
  { id: 'f5', category: 'funny_office', text: 'Mobile ta pore dekho.' },
  { id: 'f6', category: 'funny_office', text: 'Ajke Premiere Pro besh chupchap.' },
  { id: 'f7', category: 'funny_office', text: 'Keyboard ta bhenge phelbe naki?' },
  { id: 'f8', category: 'funny_office', text: 'Koto bar undo korbe?' },
  { id: 'f9', category: 'funny_office', text: 'Instagram reels dekhcho naki?' },
  { id: 'f10', category: 'funny_office', text: 'Cha kheye energy aseni mone hocche!' },
  { id: 'f11', category: 'funny_office', text: 'Bhabcho ki eto? Kaj koro!' },
  { id: 'f12', category: 'funny_office', text: 'Processor gorom hocche, tumio thanda hou.' },
  { id: 'f13', category: 'funny_office', text: 'Ami dekhchi kintu, sob record hocche! 👀' },

  // 5. Boss Messages (Abhishek da)
  { id: 'b1', category: 'boss', text: 'Abhishek da progress jiggesh korte pare.' },
  { id: 'b2', category: 'boss', text: 'Boss expect korche ekta clean edit.' },
  { id: 'b3', category: 'boss', text: 'Ajke boss ke impress korte hobe!' },
  { id: 'b4', category: 'boss', text: 'Abhishek da update dekhbe.' },
  { id: 'b5', category: 'boss', text: 'Review te jeno Abhishek dar bhalo lage.' },
  { id: 'b6', category: 'boss', text: 'Boss asche, kaj er speed barao!' },
  { id: 'b7', category: 'boss', text: 'Make Golden Moments proud!' },

  // 6. Motivation
  { id: 'm1', category: 'motivation', text: 'Tumi video edit korcho na. Memory create korcho.' },
  { id: 'm2', category: 'motivation', text: 'Every wedding deserves your best cut.' },
  { id: 'm3', category: 'motivation', text: 'Great art comes from patience.' },
  { id: 'm4', category: 'motivation', text: 'Consistency builds excellence.' },
  { id: 'm5', category: 'motivation', text: 'Every frame tells a golden story.' },
  { id: 'm6', category: 'motivation', text: 'You bring the Golden in Golden Moments.' },
  { id: 'm7', category: 'motivation', text: 'Keep shining, maestro!' },

  // 7. Break Reminder
  { id: 'br1', category: 'break', text: 'Ektu jol kheye nao. Stay hydrated! 💧' },
  { id: 'br2', category: 'break', text: '5 minute stretch kore abar bose poro.' },
  { id: 'br3', category: 'break', text: 'Chokh ke ektu rest dao. 20-20-20 rule!' },
  { id: 'br4', category: 'break', text: 'Cha er somoy hoyeche ki? ☕' },
  { id: 'br5', category: 'break', text: 'Take a deep breath and smile!' },

  // 8. Achievement & Pokes
  { id: 'a1', category: 'achievement', text: 'Darun progress! Keep it up!' },
  { id: 'a2', category: 'achievement', text: 'Fatafati kaj hoyeche eta! 🌟' },
  { id: 'a3', category: 'achievement', text: 'You are on fire today! 🔥' },
  { id: 'a4', category: 'achievement', text: 'Clean cut, zero complaints!' },
  { id: 'poke1', category: 'funny_office', text: 'Lathi dumu 😡' },
  { id: 'pet1', category: 'motivation', text: 'muuahhhhh 😘' },
];

export const getRandomRobotMessage = (
  category?: MessageCategory,
  recentHistory: string[] = []
): RobotMessage => {
  const pool = category ? ROBOT_MESSAGES.filter(m => m.category === category) : ROBOT_MESSAGES;
  const filtered = pool.filter(m => !recentHistory.includes(m.id));
  const candidateList = filtered.length > 0 ? filtered : pool;
  const randomIndex = Math.floor(Math.random() * candidateList.length);
  return candidateList[randomIndex];
};
