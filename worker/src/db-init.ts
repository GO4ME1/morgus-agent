// Database initialization for Thoughts system
// This will create tables if they don't exist

export async function initializeDatabase(supabaseUrl: string, supabaseKey: string) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check if thoughts table exists by trying to query it
    const { error: checkError } = await supabase
      .from('thoughts')
      .select('id')
      .limit(1);

    // If table doesn't exist, we need to create it
    // Note: Supabase REST API doesn't support CREATE TABLE directly
    // So we'll just log a warning and continue
    if (checkError && checkError.message.includes('relation "thoughts" does not exist')) {
      console.warn('Thoughts tables do not exist yet. Please create them manually or use Supabase dashboard.');
      console.warn('SQL schema available in: database/thoughts_schema.sql');
      return false;
    }

    console.log('Database tables verified successfully');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

// Simplified schema that can be created via Supabase client
export async function ensureDefaultThought(supabaseUrl: string, supabaseKey: string) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check if default thought exists
    const { data: existingThoughts } = await supabase
      .from('thoughts')
      .select('id')
      .eq('title', 'General Chat')
      .limit(1);

    if (!existingThoughts || existingThoughts.length === 0) {
      // Create default thought
      const { data, error } = await supabase
        .from('thoughts')
        .insert([
          {
            title: 'General Chat',
            description: 'Default conversation space',
            is_default: true,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Failed to create default thought:', error);
        return null;
      }

      console.log('Created default thought:', data.id);
      return data.id;
    }

    return existingThoughts[0].id;
  } catch (error) {
    console.error('Error ensuring default thought:', error);
    return null;
  }
}
