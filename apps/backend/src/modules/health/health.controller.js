// health.controller.js

import { checkHealth } from './health.service.js';

export async function healthCheck(req, res) {
  const health = await checkHealth();

  if (health.status !== 'ok') {
    return res.status(503).json(health);
  }

  return res.status(200).json(health);
}
