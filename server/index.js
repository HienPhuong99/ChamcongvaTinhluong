import http from 'node:http';
import { handleApiRequest } from './apiHandler.js';

const PORT = process.env.PORT || 4000;

const server = http.createServer(async (req, res) => {
  const handled = await handleApiRequest(req, res);
  if (!handled) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`[phuonghihi API] Hardened server listening at http://localhost:${PORT}`);
});
