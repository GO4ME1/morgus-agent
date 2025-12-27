import express from 'express';
import { generateNameSuggestions, getFamousPigNames, validateName, isNameAvailable } from './pig-name-generator';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * GET /api/morgys/name-suggestions
 * Generate name suggestions based on category
 */
router.get('/name-suggestions', async (req, res) => {
  try {
    const { category } = req.query;
    
    const suggestions = generateNameSuggestions(category as string);
    
    res.json({
      success: true,
      suggestions,
    });
  } catch (error: any) {
    console.error('Error generating name suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate name suggestions',
      message: error.message,
    });
  }
});

/**
 * GET /api/morgys/famous-pig-names
 * Get famous pig name suggestions
 */
router.get('/famous-pig-names', async (req, res) => {
  try {
    const { count = 3 } = req.query;
    
    const suggestions = getFamousPigNames(parseInt(count as string));
    
    res.json({
      success: true,
      suggestions,
    });
  } catch (error: any) {
    console.error('Error getting famous pig names:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get famous pig names',
      message: error.message,
    });
  }
});

/**
 * POST /api/morgys/validate-name
 * Validate a Morgy name
 */
router.post('/validate-name', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required',
      });
    }
    
    // Validate format
    const validation = validateName(name);
    if (!validation.valid) {
      return res.json({
        success: false,
        valid: false,
        error: validation.error,
      });
    }
    
    // Check availability
    const available = await isNameAvailable(name, supabase);
    
    res.json({
      success: true,
      valid: true,
      available,
      message: available ? 'Name is available!' : 'Name is already taken',
    });
  } catch (error: any) {
    console.error('Error validating name:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate name',
      message: error.message,
    });
  }
});

export default router;
