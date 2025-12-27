/**
 * NotebookLM API Routes
 * 
 * REST API endpoints for NotebookLM integration
 */

import { Router, Request, Response } from 'express';
import { getNotebookLMService, startNotebookLM, stopNotebookLM } from './notebooklm-service';

const router = Router();

/**
 * POST /api/notebooklm/start
 * Start the NotebookLM MCP server
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { notebookId, headless = true } = req.body;

    const service = await startNotebookLM({
      notebookId,
      headless,
      pythonEnvPath: '/home/ubuntu/notebooklm-env'
    });

    res.json({
      success: true,
      message: 'NotebookLM MCP server started',
      isRunning: service.isRunning()
    });
  } catch (error: any) {
    console.error('Failed to start NotebookLM:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/notebooklm/stop
 * Stop the NotebookLM MCP server
 */
router.post('/stop', async (req: Request, res: Response) => {
  try {
    await stopNotebookLM();

    res.json({
      success: true,
      message: 'NotebookLM MCP server stopped'
    });
  } catch (error: any) {
    console.error('Failed to stop NotebookLM:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/notebooklm/status
 * Get NotebookLM server status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const service = getNotebookLMService();
    const isRunning = service.isRunning();
    const isHealthy = isRunning ? await service.healthcheck() : false;

    res.json({
      success: true,
      isRunning,
      isHealthy
    });
  } catch (error: any) {
    res.json({
      success: true,
      isRunning: false,
      isHealthy: false
    });
  }
});

/**
 * POST /api/notebooklm/chat
 * Send a chat message to NotebookLM
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, timeout } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const service = getNotebookLMService();
    
    if (!service.isRunning()) {
      return res.status(503).json({
        success: false,
        error: 'NotebookLM MCP server not running. Start it first with POST /api/notebooklm/start'
      });
    }

    const response = await service.chat(message, { timeout });

    res.json(response);
  } catch (error: any) {
    console.error('NotebookLM chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/notebooklm/research
 * Create a research notebook (convenience endpoint)
 */
router.post('/research', async (req: Request, res: Response) => {
  try {
    const { topic, sources = [] } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
    }

    const service = getNotebookLMService();
    
    if (!service.isRunning()) {
      // Auto-start if not running
      await startNotebookLM({
        pythonEnvPath: '/home/ubuntu/notebooklm-env'
      });
    }

    // Create research prompt
    let prompt = `Research topic: ${topic}\n\n`;
    
    if (sources.length > 0) {
      prompt += `Sources to analyze:\n`;
      sources.forEach((source: string, index: number) => {
        prompt += `${index + 1}. ${source}\n`;
      });
      prompt += '\n';
    }

    prompt += `Please provide:
1. A comprehensive overview of this topic
2. Key concepts and definitions
3. Important findings or insights
4. Relevant examples or case studies
5. Summary and conclusions`;

    const response = await service.chat(prompt, { timeout: 120 });

    res.json({
      success: true,
      topic,
      sources,
      research: response.response,
      timestamp: response.timestamp
    });
  } catch (error: any) {
    console.error('NotebookLM research error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
