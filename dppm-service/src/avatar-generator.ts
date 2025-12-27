import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Avatar Generation Service
 * Generates cyberpunk pig avatars in the style of Bill, Sally, and Professor Hogsworth
 */

export interface AvatarConfig {
  // Base style
  baseColor: string;  // Primary color (green, pink, blue, purple, orange, etc.)
  accentColor: string;  // Secondary color for details
  
  // Character type
  characterType: 'business' | 'creative' | 'technical' | 'academic' | 'casual';
  
  // Accessories
  glasses?: 'sunglasses' | 'round' | 'monocle' | 'none';
  headwear?: 'none' | 'hat' | 'cap' | 'headphones';
  clothing?: 'suit' | 'hoodie' | 'tshirt' | 'jacket' | 'robot-body';
  
  // Personality traits (affects expression and pose)
  personality: 'energetic' | 'professional' | 'friendly' | 'serious' | 'playful';
}

export class AvatarGenerator {
  private openaiApiKey: string;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string, openaiApiKey: string) {
    this.openaiApiKey = openaiApiKey;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Generate avatar prompt based on configuration
   */
  private generatePrompt(config: AvatarConfig): string {
    // Enhanced prompt based on Maxine's successful generation
    const baseStyle = `A cute cyberpunk robot pig character, 3D rendered style with smooth gradients and cel-shaded lighting. Vibrant ${config.baseColor} body color with ${config.accentColor} accents on ears, snout, and accessories`;
    
    const characterDetails = this.getCharacterDetails(config.characterType);
    const accessoryDetails = this.getAccessoryDetails(config);
    const personalityDetails = this.getPersonalityDetails(config.personality);
    
    // Enhanced style instructions for consistency with Maxine
    const styleInstructions = `The pig has a round, friendly face with large expressive eyes. Robot/cyborg elements: metallic joints visible at shoulders and legs, small circuit patterns on the body, glowing ${config.accentColor} details. Dark navy blue background (#1a1a2e). Style should match Bill (green robot pig with pink sunglasses), Sally (pink pig with purple robot parts), and Professor Hogsworth (cyan pig with monocle and tweed). Same art style: vibrant neon colors, 3D rendered, cute but professional, cyberpunk aesthetic, glossy finish with rim lighting.`;

    return `${baseStyle}. ${characterDetails}. ${accessoryDetails}. ${personalityDetails}. ${styleInstructions}`;
  }

  private getCharacterDetails(type: AvatarConfig['characterType']): string {
    switch (type) {
      case 'business':
        return 'professional business attire, confident pose, executive style';
      case 'creative':
        return 'artistic and trendy style, creative accessories, expressive pose';
      case 'technical':
        return 'tech-focused with gadgets, robotic enhancements, futuristic elements';
      case 'academic':
        return 'scholarly appearance, intellectual accessories, dignified pose';
      case 'casual':
        return 'relaxed casual wear, friendly and approachable, comfortable style';
      default:
        return 'balanced professional style';
    }
  }

  private getAccessoryDetails(config: AvatarConfig): string {
    const details: string[] = [];

    if (config.glasses && config.glasses !== 'none') {
      switch (config.glasses) {
        case 'sunglasses':
          details.push('wearing stylish sunglasses');
          break;
        case 'round':
          details.push('wearing round glasses');
          break;
        case 'monocle':
          details.push('wearing a monocle');
          break;
      }
    }

    if (config.headwear && config.headwear !== 'none') {
      switch (config.headwear) {
        case 'hat':
          details.push('wearing a hat');
          break;
        case 'cap':
          details.push('wearing a cap');
          break;
        case 'headphones':
          details.push('wearing headphones');
          break;
      }
    }

    if (config.clothing) {
      switch (config.clothing) {
        case 'suit':
          details.push('in a business suit');
          break;
        case 'hoodie':
          details.push('wearing a hoodie');
          break;
        case 'tshirt':
          details.push('wearing a t-shirt');
          break;
        case 'jacket':
          details.push('wearing a jacket');
          break;
        case 'robot-body':
          details.push('with robotic body parts and armor');
          break;
      }
    }

    return details.join(', ');
  }

  private getPersonalityDetails(personality: AvatarConfig['personality']): string {
    // Enhanced personality descriptions based on Maxine's success
    switch (personality) {
      case 'energetic':
        return 'The pig has a dynamic, enthusiastic pose - one hoof raised in excitement, leaning forward with energy. Expression shows excitement and high energy with big smile';
      case 'professional':
        return 'The pig has a confident stance with professional demeanor, standing tall and poised. Expression shows competence and reliability with slight smile';
      case 'friendly':
        return 'The pig has a welcoming pose with warm, kind expression. One hoof waving in greeting. Expression shows approachability and warmth with friendly smile';
      case 'serious':
        return 'The pig has a focused stance with determined expression, standing firm and composed. Expression shows concentration and professionalism with serious look';
      case 'playful':
        return 'The pig has a fun, dynamic pose with playful expression and energetic body language. Expression shows joy and enthusiasm with big happy smile';
      default:
        return 'friendly and approachable with warm welcoming expression';
    }
  }

  /**
   * Generate avatar using DALL-E 3
   */
  async generateAvatar(config: AvatarConfig): Promise<string> {
    try {
      const prompt = this.generatePrompt(config);

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'hd', // Use HD quality for Maxine-level results
          style: 'vivid'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`DALL-E API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const imageUrl = data.data[0].url;

      return imageUrl;
    } catch (error: any) {
      console.error('Avatar generation error:', error);
      throw new Error(`Failed to generate avatar: ${error.message}`);
    }
  }

  /**
   * Download image from URL and upload to Supabase Storage
   */
  async saveAvatarToStorage(imageUrl: string, morgyId: string): Promise<string> {
    try {
      // Download image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const buffer = Buffer.from(await blob.arrayBuffer());

      // Upload to Supabase Storage
      const filename = `${morgyId}-${Date.now()}.png`;
      const { data, error } = await this.supabase.storage
        .from('avatars')
        .upload(filename, buffer, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(filename);

      return publicUrl;
    } catch (error: any) {
      console.error('Avatar storage error:', error);
      throw new Error(`Failed to save avatar: ${error.message}`);
    }
  }

  /**
   * Generate and save avatar in one step
   */
  async generateAndSaveAvatar(config: AvatarConfig, morgyId: string): Promise<string> {
    // Generate avatar
    const imageUrl = await this.generateAvatar(config);

    // Save to storage
    const publicUrl = await this.saveAvatarToStorage(imageUrl, morgyId);

    return publicUrl;
  }

  /**
   * Get preset configurations for common Morgy types
   */
  static getPresetConfig(type: string): AvatarConfig {
    const presets: Record<string, AvatarConfig> = {
      business: {
        baseColor: 'navy blue',
        accentColor: 'gold',
        characterType: 'business',
        glasses: 'round',
        headwear: 'none',
        clothing: 'suit',
        personality: 'professional'
      },
      marketing: {
        baseColor: 'hot pink',
        accentColor: 'purple',
        characterType: 'creative',
        glasses: 'sunglasses',
        headwear: 'none',
        clothing: 'hoodie',
        personality: 'energetic'
      },
      development: {
        baseColor: 'neon green',
        accentColor: 'cyan',
        characterType: 'technical',
        glasses: 'round',
        headwear: 'headphones',
        clothing: 'robot-body',
        personality: 'serious'
      },
      design: {
        baseColor: 'vibrant purple',
        accentColor: 'pink',
        characterType: 'creative',
        glasses: 'round',
        headwear: 'none',
        clothing: 'tshirt',
        personality: 'playful'
      },
      research: {
        baseColor: 'cyan',
        accentColor: 'blue',
        characterType: 'academic',
        glasses: 'monocle',
        headwear: 'none',
        clothing: 'suit',
        personality: 'serious'
      },
      writing: {
        baseColor: 'warm orange',
        accentColor: 'yellow',
        characterType: 'creative',
        glasses: 'round',
        headwear: 'none',
        clothing: 'jacket',
        personality: 'friendly'
      },
      education: {
        baseColor: 'royal blue',
        accentColor: 'gold',
        characterType: 'academic',
        glasses: 'round',
        headwear: 'none',
        clothing: 'suit',
        personality: 'friendly'
      }
    };

    return presets[type] || presets.business;
  }

  /**
   * Get random color combinations
   */
  static getRandomColors(): { baseColor: string; accentColor: string } {
    const colorPairs = [
      { baseColor: 'neon green', accentColor: 'hot pink' },
      { baseColor: 'hot pink', accentColor: 'purple' },
      { baseColor: 'cyan', accentColor: 'blue' },
      { baseColor: 'vibrant purple', accentColor: 'pink' },
      { baseColor: 'electric blue', accentColor: 'cyan' },
      { baseColor: 'neon orange', accentColor: 'yellow' },
      { baseColor: 'magenta', accentColor: 'purple' },
      { baseColor: 'lime green', accentColor: 'yellow' },
      { baseColor: 'royal blue', accentColor: 'gold' },
      { baseColor: 'crimson red', accentColor: 'orange' }
    ];

    return colorPairs[Math.floor(Math.random() * colorPairs.length)];
  }
}

/**
 * Example usage:
 * 
 * const generator = new AvatarGenerator(
 *   process.env.SUPABASE_URL,
 *   process.env.SUPABASE_SERVICE_ROLE_KEY,
 *   process.env.OPENAI_API_KEY
 * );
 * 
 * // Use preset
 * const config = AvatarGenerator.getPresetConfig('marketing');
 * const avatarUrl = await generator.generateAndSaveAvatar(config, morgyId);
 * 
 * // Or customize
 * const customConfig: AvatarConfig = {
 *   baseColor: 'neon green',
 *   accentColor: 'hot pink',
 *   characterType: 'technical',
 *   glasses: 'sunglasses',
 *   headwear: 'headphones',
 *   clothing: 'robot-body',
 *   personality: 'energetic'
 * };
 * const customAvatarUrl = await generator.generateAndSaveAvatar(customConfig, morgyId);
 */
