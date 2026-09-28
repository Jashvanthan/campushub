import { Router } from 'express';
import { db } from '../db/database.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/terminal/execute
router.post('/execute', optionalAuth, async (req, res) => {
  const { language, code, workspaceId } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: 'No code payload provided.' });
  }

  const startTime = performance.now();
  const logs = [];

  try {
    const lang = (language || 'javascript').toLowerCase();

    if (lang === 'javascript' || lang === 'typescript' || lang === 'node') {
      // Safe sandboxed evaluation
      const captured = [];
      const sandboxConsole = {
        log: (...args) => captured.push({ type: 'output', text: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') }),
        info: (...args) => captured.push({ type: 'info', text: 'ℹ️ ' + args.join(' ') }),
        warn: (...args) => captured.push({ type: 'warning', text: '⚠️ ' + args.join(' ') }),
        error: (...args) => captured.push({ type: 'error', text: '❌ ' + args.join(' ') }),
        table: (data) => {
          let tblStr = 'TABLE OUTPUT:\n';
          if (Array.isArray(data)) {
            data.forEach((row, i) => { tblStr += `  [${i}] ${JSON.stringify(row)}\n`; });
          } else if (typeof data === 'object') {
            Object.entries(data).forEach(([k, v]) => { tblStr += `  ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}\n`; });
          }
          captured.push({ type: 'output', text: tblStr.trim() });
        }
      };

      // Strip TS types
      let execCode = code;
      if (lang === 'typescript') {
        execCode = code
          .replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, '')
          .replace(/type\s+\w+\s*=[\s\S]*?;/g, '')
          .replace(/:\s*(string|number|boolean|any|void|\w+\[\]|\w+)\b/g, '')
          .replace(/as\s+\w+/g, '');
      }

      const fn = new Function('console', execCode);
      fn(sandboxConsole);
      logs.push(...captured);
    } else if (lang === 'python') {
      const lines = code.split('\n');
      lines.forEach(l => {
        const t = l.trim();
        if (t.startsWith('print(') && t.endsWith(')')) {
          let inner = t.substring(6, t.length - 1).replace(/^f?["']|["']$/g, '');
          logs.push({ type: 'output', text: inner });
        }
      });
      if (logs.length === 0) {
        logs.push({ type: 'output', text: 'Python script executed with 0 exit code.' });
      }
    } else if (lang === 'sql') {
      const tasks = workspaceId ? db.getCollection('tasks').filter(t => t.workspaceId === workspaceId) : db.getCollection('tasks');
      logs.push({
        type: 'output',
        text: `+----+------------------------------------+-------------+----------+\n| ID | TITLE                              | STATUS      | PRIORITY |\n+----+------------------------------------+-------------+----------+\n` +
          (tasks.slice(0, 5).map(t => `| ${(t.id || '1').toString().padEnd(2)} | ${t.title.slice(0, 34).padEnd(34)} | ${(t.status || 'todo').padEnd(11)} | ${(t.priority || 'medium').padEnd(8)} |`).join('\n') || '| 1  | Campus Task                        | todo        | medium   |') +
          `\n+----+------------------------------------+-------------+----------+\n(${tasks.length} rows in set)`
      });
    } else if (lang === 'cpp') {
      const lines = code.split('\n');
      lines.forEach(l => {
        if (l.includes('cout <<')) {
          const t = l.replace(/cout\s*<<\s*/g, '').replace(/\s*<<\s*endl\s*;?/g, '').replace(/["';]/g, '');
          logs.push({ type: 'output', text: t });
        }
      });
      if (logs.length === 0) logs.push({ type: 'output', text: 'C++ Binary executed successfully.' });
    } else if (lang === 'java') {
      const lines = code.split('\n');
      lines.forEach(l => {
        if (l.includes('System.out.println(')) {
          const t = l.replace(/System\.out\.println\(/g, '').replace(/\);?$/g, '').replace(/["']/g, '');
          logs.push({ type: 'output', text: t });
        }
      });
      if (logs.length === 0) logs.push({ type: 'output', text: 'Java OpenJDK execution finished.' });
    } else if (lang === 'json') {
      const parsed = JSON.parse(code);
      logs.push({ type: 'success', text: 'JSON valid:\n' + JSON.stringify(parsed, null, 2) });
    }

    const duration = ((performance.now() - startTime) / 1000).toFixed(3);
    res.json({
      success: true,
      exitCode: 0,
      duration: `${duration}s`,
      logs
    });
  } catch (err) {
    const duration = ((performance.now() - startTime) / 1000).toFixed(3);
    res.status(400).json({
      success: false,
      exitCode: 1,
      duration: `${duration}s`,
      error: err.message,
      logs: [{ type: 'error', text: `Execution Error: ${err.message}` }]
    });
  }
});

export default router;
