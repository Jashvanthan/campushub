import { WebSocketServer, WebSocket } from 'ws';

export function setupWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map(); // ws -> { userId, workspaceId }

  wss.on('connection', (ws) => {
    console.log('⚡ New WebSocket client connected to CampusHub.');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        const { type, payload } = data;

        if (type === 'JOIN_WORKSPACE') {
          clients.set(ws, {
            userId: payload.userId,
            userName: payload.userName,
            workspaceId: payload.workspaceId
          });
          broadcastToWorkspace(payload.workspaceId, {
            type: 'USER_JOINED',
            payload: { userId: payload.userId, userName: payload.userName }
          }, ws);
        } else if (type === 'CHAT_MESSAGE') {
          broadcastToWorkspace(payload.workspaceId, {
            type: 'NEW_CHAT_MESSAGE',
            payload
          });
        } else if (type === 'TASK_UPDATE') {
          broadcastToWorkspace(payload.workspaceId, {
            type: 'TASK_UPDATED',
            payload
          });
        } else if (type === 'TERMINAL_SHARE') {
          broadcastToWorkspace(payload.workspaceId, {
            type: 'TERMINAL_SHARED',
            payload
          });
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      const client = clients.get(ws);
      if (client) {
        broadcastToWorkspace(client.workspaceId, {
          type: 'USER_LEFT',
          payload: { userId: client.userId, userName: client.userName }
        }, ws);
        clients.delete(ws);
      }
    });
  });

  function broadcastToWorkspace(workspaceId, message, senderWs = null) {
    const raw = JSON.stringify(message);
    wss.clients.forEach((client) => {
      if (client !== senderWs && client.readyState === WebSocket.OPEN) {
        const info = clients.get(client);
        if (info && info.workspaceId === workspaceId) {
          client.send(raw);
        }
      }
    });
  }

  return wss;
}
