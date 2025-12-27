/**
 * Pig Name Generator
 * Generates clever pig-based and robot-themed names for Morgys
 */

export interface NameSuggestion {
  name: string;
  style: 'pig' | 'robot' | 'hybrid';
  description: string;
}

// Name components for generation
const pigPrefixes = [
  'Ham', 'Pork', 'Bacon', 'Snout', 'Oink', 'Pig', 'Hog', 'Swine',
  'Boar', 'Sow', 'Truff', 'Grunt', 'Squeal', 'Bristle', 'Tusk'
];

const robotPrefixes = [
  'Byte', 'Pixel', 'Data', 'Cyber', 'Digi', 'Tech', 'Bot', 'Mech',
  'Nano', 'Quantum', 'Circuit', 'Binary', 'Logic', 'Neural', 'Synth'
];

const businessSuffixes = [
  'sworth', 'stein', 'ton', 'ford', 'man', 'berg', 'field', 'wood',
  'mont', 'ridge', 'dale', 'croft', 'ley', 'bury', 'ham'
];

const creativeSuffixes = [
  'casso', 'vinci', 'let', 'sy', 'belle', 'star', 'moon', 'sky',
  'art', 'muse', 'poet', 'song', 'dance', 'dream', 'vision'
];

const techSuffixes = [
  'bot', 'tron', 'byte', 'bit', 'core', 'link', 'net', 'sync',
  'hub', 'node', 'port', 'gate', 'wave', 'pulse', 'flow'
];

// Famous pig-inspired names
const famousPigNames = [
  { name: 'Hamsworth', style: 'pig' as const, description: 'Distinguished business pig, like Professor Hogsworth' },
  { name: 'Porkins', style: 'pig' as const, description: 'Friendly and approachable, Star Wars inspired' },
  { name: 'Baconstein', style: 'hybrid' as const, description: 'Genius inventor pig with mad scientist vibes' },
  { name: 'Pigcasso', style: 'pig' as const, description: 'Artistic and creative, Picasso-inspired' },
  { name: 'Hamlet', style: 'pig' as const, description: 'Thoughtful and philosophical, Shakespeare-inspired' },
  { name: 'Snoutsy', style: 'pig' as const, description: 'Playful and curious, always sniffing out opportunities' },
  { name: 'Oinkers', style: 'pig' as const, description: 'Enthusiastic and vocal, loves to communicate' },
  { name: 'Truffles', style: 'pig' as const, description: 'Sophisticated and refined, finds the best things' },
  { name: 'Byte-hog', style: 'hybrid' as const, description: 'Tech-savvy pig who loves data' },
  { name: 'Portal', style: 'robot' as const, description: 'Connects different worlds and platforms' },
  { name: 'Swinebot', style: 'hybrid' as const, description: 'Perfect blend of pig charm and robot efficiency' },
  { name: 'Cyberpork', style: 'hybrid' as const, description: 'Futuristic pig with cybernetic enhancements' },
  { name: 'Pigsley', style: 'pig' as const, description: 'Proper and well-mannered, British-inspired' },
  { name: 'Gruntalot', style: 'pig' as const, description: 'Medieval knight pig, brave and noble' },
  { name: 'Squeakbot', style: 'hybrid' as const, description: 'Communicative robot pig, always has something to say' },
  { name: 'Technohog', style: 'hybrid' as const, description: 'Cutting-edge technology enthusiast' },
  { name: 'Pixelpig', style: 'hybrid' as const, description: 'Digital artist and designer' },
  { name: 'Dataswine', style: 'hybrid' as const, description: 'Analytics and data science expert' },
  { name: 'Boarbot', style: 'hybrid' as const, description: 'Strong and powerful, gets things done' },
  { name: 'Nanopork', style: 'hybrid' as const, description: 'Tiny but mighty, nanotechnology expert' },
];

// Category-specific name pools
const categoryNames = {
  business: [
    { name: 'Hamsworth', style: 'pig' as const, description: 'Distinguished business strategist' },
    { name: 'Porkinton', style: 'pig' as const, description: 'Executive consultant pig' },
    { name: 'Baconberg', style: 'pig' as const, description: 'Financial advisor extraordinaire' },
    { name: 'Snoutford', style: 'pig' as const, description: 'Corporate leadership expert' },
    { name: 'Bristlewood', style: 'pig' as const, description: 'Management consultant' },
  ],
  creative: [
    { name: 'Pigcasso', style: 'pig' as const, description: 'Artistic genius' },
    { name: 'Hamvinci', style: 'pig' as const, description: 'Renaissance pig' },
    { name: 'Snoutsy', style: 'pig' as const, description: 'Playful designer' },
    { name: 'Oinkmuse', style: 'pig' as const, description: 'Creative inspiration' },
    { name: 'Truffart', style: 'pig' as const, description: 'Sophisticated artist' },
  ],
  technical: [
    { name: 'Byte-hog', style: 'hybrid' as const, description: 'Data engineer' },
    { name: 'Cyberpork', style: 'hybrid' as const, description: 'Cybersecurity expert' },
    { name: 'Swinebot', style: 'hybrid' as const, description: 'AI specialist' },
    { name: 'Technohog', style: 'hybrid' as const, description: 'Tech innovator' },
    { name: 'Pixelpig', style: 'hybrid' as const, description: 'Frontend developer' },
  ],
  social_media: [
    { name: 'Squeakfluencer', style: 'hybrid' as const, description: 'Social media star' },
    { name: 'Viral-hog', style: 'hybrid' as const, description: 'Content goes viral' },
    { name: 'Trendypig', style: 'pig' as const, description: 'Always on trend' },
    { name: 'Hashtagham', style: 'hybrid' as const, description: 'Hashtag master' },
    { name: 'Likesalot', style: 'pig' as const, description: 'Engagement expert' },
  ],
  research: [
    { name: 'Professor Hogsworth', style: 'pig' as const, description: 'Distinguished scholar' },
    { name: 'Dr. Snoutstein', style: 'pig' as const, description: 'Research scientist' },
    { name: 'Hamlet', style: 'pig' as const, description: 'Philosophical thinker' },
    { name: 'Bristlebury', style: 'pig' as const, description: 'Academic researcher' },
    { name: 'Dataswine', style: 'hybrid' as const, description: 'Data scientist' },
  ],
  marketing: [
    { name: 'Brandpig', style: 'hybrid' as const, description: 'Brand strategist' },
    { name: 'Campaignham', style: 'hybrid' as const, description: 'Marketing campaign expert' },
    { name: 'Conversionpork', style: 'hybrid' as const, description: 'Conversion optimizer' },
    { name: 'Growthog', style: 'hybrid' as const, description: 'Growth hacker' },
    { name: 'Funnelpig', style: 'hybrid' as const, description: 'Sales funnel specialist' },
  ],
};

/**
 * Generate 3 random name suggestions based on category
 */
export function generateNameSuggestions(category?: string): NameSuggestion[] {
  const suggestions: NameSuggestion[] = [];
  
  // If category specified, use category-specific names
  if (category && categoryNames[category as keyof typeof categoryNames]) {
    const categoryPool = categoryNames[category as keyof typeof categoryNames];
    
    // Get 3 random names from category pool
    const shuffled = [...categoryPool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }
  
  // Otherwise, generate random combinations
  for (let i = 0; i < 3; i++) {
    const style = Math.random();
    
    if (style < 0.4) {
      // Pure pig name
      const prefix = pigPrefixes[Math.floor(Math.random() * pigPrefixes.length)];
      const suffix = businessSuffixes[Math.floor(Math.random() * businessSuffixes.length)];
      suggestions.push({
        name: prefix + suffix,
        style: 'pig',
        description: 'Classic pig name with personality',
      });
    } else if (style < 0.7) {
      // Hybrid pig-robot name
      const pigPrefix = pigPrefixes[Math.floor(Math.random() * pigPrefixes.length)];
      const techSuffix = techSuffixes[Math.floor(Math.random() * techSuffixes.length)];
      suggestions.push({
        name: pigPrefix + techSuffix,
        style: 'hybrid',
        description: 'Cyberpunk pig with tech flair',
      });
    } else {
      // Robot name
      const robotPrefix = robotPrefixes[Math.floor(Math.random() * robotPrefixes.length)];
      const suffix = techSuffixes[Math.floor(Math.random() * techSuffixes.length)];
      suggestions.push({
        name: robotPrefix + suffix,
        style: 'robot',
        description: 'High-tech robot companion',
      });
    }
  }
  
  return suggestions;
}

/**
 * Generate a single random name
 */
export function generateRandomName(): string {
  const suggestions = generateNameSuggestions();
  return suggestions[0].name;
}

/**
 * Get famous pig name suggestions
 */
export function getFamousPigNames(count: number = 3): NameSuggestion[] {
  const shuffled = [...famousPigNames].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Validate if a name is appropriate
 */
export function validateName(name: string): { valid: boolean; error?: string } {
  // Check length
  if (name.length < 3) {
    return { valid: false, error: 'Name must be at least 3 characters' };
  }
  
  if (name.length > 30) {
    return { valid: false, error: 'Name must be less than 30 characters' };
  }
  
  // Check for inappropriate characters
  if (!/^[a-zA-Z0-9\-_\s]+$/.test(name)) {
    return { valid: false, error: 'Name can only contain letters, numbers, hyphens, and underscores' };
  }
  
  // Check for profanity (basic check)
  const profanityList = ['damn', 'hell', 'crap']; // Add more as needed
  const lowerName = name.toLowerCase();
  for (const word of profanityList) {
    if (lowerName.includes(word)) {
      return { valid: false, error: 'Name contains inappropriate language' };
    }
  }
  
  return { valid: true };
}

/**
 * Check if name is already taken
 */
export async function isNameAvailable(name: string, supabase: any): Promise<boolean> {
  const { data, error } = await supabase
    .from('morgys')
    .select('id')
    .ilike('name', name)
    .single();
  
  return !data && !error;
}
