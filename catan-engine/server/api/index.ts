import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Health check endpoint
  if (req.url === '/health' || req.url === '/api/health') {
    return res.status(200).json({ status: 'ok', message: 'Server is running' });
  }

  res.status(200).json({
    message: 'CoopCatan Server API',
    note: 'Socket.io connections should use a separate deployment (Railway, Render, or Heroku)',
    endpoints: {
      health: '/health'
    }
  });
}
