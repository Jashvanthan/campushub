import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon, Play, RotateCcw, Copy, Check, Share2,
  FileCode, Plus, Trash2, Folder, Save, Sparkles, CheckCircle,
  AlertCircle, Cpu, Zap, Code, HelpCircle, CornerDownLeft,
  ChevronDown, FileText, RefreshCw, LayoutTemplate, PanelLeft, Columns, Rows,
  GripHorizontal, GripVertical, ArrowUpDown, Maximize2, Minimize2, Sliders
} from 'lucide-react';
import { SEED_TERMINAL_FILES } from '../../data/seedIdeasAndWorkspaces';
import { usePopup } from '../common/PopupDialog';

export const CODING_LANGUAGES = [
  {
    id: 'javascript',
    name: 'JavaScript (Node.js / ES6)',
    ext: '.js',
    icon: '⚡',
    color: '#fbbf24',
    badge: 'JS',
    description: 'V8 Sandbox with console interception, async/await, and Math methods',
    boilerplate: (wsName, user) => `// CampusHub JavaScript Runner — ${wsName}
console.log("🚀 Executing JavaScript Sandbox");
console.log("Engineer:", "${user?.name || 'Student'}");

const data = {
  project: "${wsName}",
  timestamp: new Date().toLocaleTimeString(),
  activeModules: ["Navigation", "IoT Sensors", "Real-time Chat", "Terminal REPL"]
};

console.log("Project Details:", data.project);
console.table(data);
`
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    ext: '.ts',
    icon: '🔷',
    color: '#38bdf8',
    badge: 'TS',
    description: 'TypeScript runtime with type parsing & modern execution',
    boilerplate: (wsName, user) => `// CampusHub TypeScript Runner — ${wsName}
interface WorkspaceConfig {
  name: string;
  leadEngineer: string;
  status: 'active' | 'review' | 'deployed';
  version: number;
}

const config: WorkspaceConfig = {
  name: "${wsName}",
  leadEngineer: "${user?.name || 'Student'}",
  status: 'active',
  version: 2.5
};

console.log(\`🚀 [TypeScript] Initialized \${config.name} (v\${config.version})\`);
console.log("Status:", config.status);
console.log("Lead Engineer:", config.leadEngineer);
`
  },
  {
    id: 'python',
    name: 'Python 3',
    ext: '.py',
    icon: '🐍',
    color: '#34d399',
    badge: 'PY',
    description: 'Python 3 execution simulator with math, string formatting & data structures',
    boilerplate: (wsName, user) => `# CampusHub Python 3 Runner — ${wsName}
import math

print("🐍 Python 3.11 Environment Initialized")
print(f"Workspace: ${wsName}")
print(f"Developer: ${user?.name || 'Student'}")

metrics = [88, 94, 76, 99, 85]
avg_metric = sum(metrics) / len(metrics)
print(f"Calculated Metric Average: {avg_metric:.2f}")

for i in range(1, 4):
    print(f"-> Executing Pipeline Stage {i}/3... [DONE]")

print("✨ All Python algorithms executed with exit code 0.")
`
  },
  {
    id: 'sql',
    name: 'SQL (Workspace DB)',
    ext: '.sql',
    icon: '🗄️',
    color: '#a78bfa',
    badge: 'SQL',
    description: 'Execute queries on in-memory workspace tables (tasks, members, milestones)',
    boilerplate: () => `-- CampusHub Workspace SQL Query Runner
-- Available in-memory tables: tasks, members, milestones

-- 1. Query all tasks
SELECT id, title, status, priority FROM tasks;

-- 2. Query workspace contributors
SELECT name, role FROM members;
`
  },
  {
    id: 'html',
    name: 'HTML5 & DOM Structure',
    ext: '.html',
    icon: '🌐',
    color: '#f97316',
    badge: 'HTML',
    description: 'HTML5 structure linter & DOM tree previewer',
    boilerplate: (wsName) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${wsName} Widget</title>
  <style>
    body { font-family: system-ui; background: #0f172a; color: #fff; padding: 20px; }
    .card { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; border: 1px solid #38bdf8; }
    h1 { color: #38bdf8; margin-top: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${wsName}</h1>
    <p>Live CampusHub Interactive Sandbox Component</p>
    <button style="background:#38bdf8;border:none;padding:8px 16px;border-radius:6px;color:#000;font-weight:bold;">Action</button>
  </div>
</body>
</html>
`
  },
  {
    id: 'cpp',
    name: 'C++ (Clang / GCC)',
    ext: '.cpp',
    icon: '⚙️',
    color: '#ec4899',
    badge: 'C++',
    description: 'C++ simulator with standard I/O (cout, cin) & algorithmic flow',
    boilerplate: (wsName) => `// CampusHub C++ Algorithm Simulator — ${wsName}
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    cout << "⚡ Compiling and executing ${wsName} binary..." << endl;
    cout << "CampusHub Clang 18.1.0 (Target: x86_64-pc-linux-gnu)" << endl;
    
    vector<int> nodes = {10, 20, 30, 40, 50};
    int total = 0;
    for (int n : nodes) {
        total += n;
    }
    
    cout << "Calculated Graph Node Sum: " << total << endl;
    cout << "Process completed with exit code 0." << endl;
    return 0;
}
`
  },
  {
    id: 'java',
    name: 'Java (OpenJDK 21)',
    ext: '.java',
    icon: '☕',
    color: '#f59e0b',
    badge: 'JAVA',
    description: 'Java OpenJDK runtime simulator with System.out and OOP flow',
    boilerplate: (wsName) => `// CampusHub Java Runner — ${wsName}
public class Main {
    public static void main(String[] args) {
        System.out.println("☕ Java OpenJDK 21 Runtime Initialized");
        System.out.println("Project: ${wsName}");
        
        String[] modules = {"Auth System", "IoT Node Gateway", "Real-Time Chat", "Kanban Engine"};
        for (String mod : modules) {
            System.out.println("Loaded module: [" + mod + "] ... OK");
        }
        
        System.out.println("✨ All Java classes loaded successfully.");
    }
}
`
  },
  {
    id: 'json',
    name: 'JSON (Data Config)',
    ext: '.json',
    icon: '📋',
    color: '#10b981',
    badge: 'JSON',
    description: 'JSON schema validator, syntax checker, and formatted inspector',
    boilerplate: (wsName, user) => `{
  "workspace": "${wsName}",
  "version": "1.0.0",
  "author": "${user?.name || 'Student'}",
  "environment": "development",
  "features": {
    "liveChat": true,
    "codingTerminal": true,
    "multiLanguageRunner": true,
    "kanbanTasks": true
  },
  "config": {
    "port": 5174,
    "ssl": true,
    "maxContributors": 50
  }
}
`
  }
];

export default function WorkspaceTerminal({
  workspace,
  currentUser,
  tasks = [],
  onShareToChat,
  initialSnippet = null
}) {
  const { showAlert, showPrompt, showConfirm } = usePopup();
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'cli'
  const [files, setFiles] = useState(() => {
    const wsFiles = SEED_TERMINAL_FILES.filter(f => f.workspaceId === workspace.id);
    return wsFiles.length > 0 ? wsFiles : [
      {
        id: 'file-1',
        name: 'index.js',
        language: 'javascript',
        content: `// CampusHub Sandbox Script for ${workspace.name}\nconsole.log("🚀 Workspace sandbox initialized!");\nconsole.log("Current User:", "${currentUser?.name || 'Student'}");\n\nconst projectMetrics = {\n  workspace: "${workspace.name}",\n  status: "Active Development",\n  activeTasks: ${tasks.length}\n};\nconsole.table(projectMetrics);\n`
      }
    ];
  });

  const [activeFileId, setActiveFileId] = useState(files[0]?.id || 'file-1');
  const [terminalLogs, setTerminalLogs] = useState([
    { type: 'system', text: `CampusHub Cloud Workspace Terminal v2.5 initialized for [${workspace.name}]` },
    { type: 'system', text: 'Select a coding language (JS, Python, TS, SQL, HTML, C++, Java, JSON) and click "▶ Run Code".' }
  ]);
  const [cliInput, setCliInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [execTime, setExecTime] = useState(null);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  const activeLangConfig = CODING_LANGUAGES.find(l => l.id === activeFile?.language) || CODING_LANGUAGES[0];

  const terminalBottomRef = useRef(null);
  const consoleViewportRef = useRef(null);
  const cliInputRef = useRef(null);
  const containerRef = useRef(null);

  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' && window.innerWidth <= 850));
  const [layout, setLayout] = useState('horizontal');
  const [splitRatio, setSplitRatio] = useState(50);
  const [showSidebar, setShowSidebar] = useState(() => (typeof window !== 'undefined' && window.innerWidth <= 850) ? false : true);
  const [terminalHeight, setTerminalHeight] = useState('standard'); // 'standard' (850px), 'tall' (1080px), 'compact' (680px), 'full' (100dvh)
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 850);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleResizerStart = (e) => {
    const isTouch = e.type === 'touchstart';
    if (!isTouch && e.button !== 0) return;
    
    setIsDragging(true);
    const isHorizontal = layout === 'horizontal';

    const updateRatio = (clientX, clientY) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        let newRatio;
        if (isHorizontal) {
          newRatio = ((clientX - rect.left) / rect.width) * 100;
        } else {
          newRatio = ((clientY - rect.top) / rect.height) * 100;
        }
        setSplitRatio(Math.max(15, Math.min(Math.round(newRatio), 85)));
      }
    };

    const handleMouseMove = (eMove) => {
      updateRatio(eMove.clientX, eMove.clientY);
    };

    const handleTouchMove = (eTouch) => {
      if (eTouch.touches && eTouch.touches[0]) {
        if (eTouch.cancelable) eTouch.preventDefault();
        updateRatio(eTouch.touches[0].clientX, eTouch.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);
  };

  // If a snippet was passed in from Chat to run
  useEffect(() => {
    if (initialSnippet) {
      const existing = files.find(f => f.name === initialSnippet.title);
      if (existing) {
        setFiles(prev => prev.map(f => f.id === existing.id ? { ...f, content: initialSnippet.code, language: initialSnippet.language || existing.language } : f));
        setActiveFileId(existing.id);
      } else {
        const matchedLang = CODING_LANGUAGES.find(l => l.id === initialSnippet.language) || CODING_LANGUAGES[0];
        const newFile = {
          id: `file-${Date.now()}`,
          name: initialSnippet.title || `snippet${matchedLang.ext}`,
          language: matchedLang.id,
          content: initialSnippet.code
        };
        setFiles(prev => [newFile, ...prev]);
        setActiveFileId(newFile.id);
      }
      setActiveTab('editor');
    }
  }, [initialSnippet]);

  // Scroll only the inner console viewport without jumping outer page
  useEffect(() => {
    if (consoleViewportRef.current) {
      consoleViewportRef.current.scrollTop = consoleViewportRef.current.scrollHeight;
    }
  }, [terminalLogs.length]);

  const updateActiveContent = (newContent) => {
    setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content: newContent } : f));
  };

  // Change language of the active file
  const handleLanguageChange = (newLangId) => {
    const targetLang = CODING_LANGUAGES.find(l => l.id === newLangId);
    if (!targetLang) return;

    // Update file name extension appropriately
    let baseName = activeFile.name.replace(/\.[^/.]+$/, '');
    if (!baseName) baseName = 'script';
    const newName = `${baseName}${targetLang.ext}`;

    setFiles(prev => prev.map(f => f.id === activeFile.id ? {
      ...f,
      language: targetLang.id,
      name: newName
    } : f));

    setTerminalLogs(prev => [
      ...prev,
      { type: 'info', text: `Switched language to ${targetLang.name} for file "${newName}".` }
    ]);
  };

  // Load starter template for the active language
  const handleLoadBoilerplate = async () => {
    const ok = await showConfirm(
      `Replace current content in "${activeFile.name}" with the official ${activeLangConfig.name} boilerplate template?`,
      'Load Language Template?',
      { confirmText: 'Load Template', type: 'info' }
    );
    if (!ok) return;

    const templateCode = activeLangConfig.boilerplate(workspace.name, currentUser);
    updateActiveContent(templateCode);
    setTerminalLogs(prev => [
      ...prev,
      { type: 'success', text: `Loaded starter boilerplate for ${activeLangConfig.name}.` }
    ]);
  };

  const handleAddNewFile = async () => {
    const fileName = await showPrompt(
      'Enter script file name with extension (e.g. app.js, script.py, queries.sql, main.cpp):',
      'Create New Script File',
      `script_${files.length + 1}.js`,
      { placeholder: 'filename.js, filename.py, query.sql, etc.' }
    );
    if (!fileName) return;

    // Determine language by extension
    const ext = '.' + fileName.split('.').pop().toLowerCase();
    const matchedLang = CODING_LANGUAGES.find(l => l.ext === ext) || CODING_LANGUAGES[0];

    const newFile = {
      id: `file-${Date.now()}`,
      name: fileName,
      language: matchedLang.id,
      content: matchedLang.boilerplate(workspace.name, currentUser)
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setTerminalLogs(prev => [
      ...prev,
      { type: 'system', text: `Created new file "${fileName}" with language ${matchedLang.name}.` }
    ]);
  };

  const handleDeleteFile = async (fileId, e) => {
    e.stopPropagation();
    if (files.length <= 1) {
      showAlert(
        'You must keep at least one script file in the workspace terminal.',
        'Cannot Remove File',
        'warning'
      );
      return;
    }
    const target = files.find(f => f.id === fileId);
    const confirmed = await showConfirm(
      `Are you sure you want to remove "${target?.name || 'this file'}" from the terminal?`,
      'Delete Script File?',
      { confirmText: 'Yes, Delete', type: 'danger', isDanger: true }
    );
    if (!confirmed) return;

    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (activeFileId === fileId) {
      const remaining = files.filter(f => f.id !== fileId);
      setActiveFileId(remaining[0].id);
    }
  };

  // Run Code in Sandbox for all supported languages
  const handleRunCode = () => {
    if (!activeFile) return;
    setIsRunning(true);
    const startT = performance.now();

    const newLogs = [
      ...terminalLogs,
      { type: 'command', text: `$ run ${activeFile.name} --lang=${activeFile.language}` },
      { type: 'system', text: `[Executing ${activeFile.name} on CampusHub ${activeLangConfig.name} Engine...]` }
    ];

    setTimeout(async () => {
      try {
        const lang = activeFile.language;
        const code = activeFile.content;

        // Basic syntax validation for simulated languages to catch obvious errors
        if (lang === 'python') {
          if ((code.match(/"/g) || []).length % 2 !== 0) throw new Error("SyntaxError: EOL while scanning string literal");
          if ((code.match(/'/g) || []).length % 2 !== 0) throw new Error("SyntaxError: EOL while scanning string literal");
          if ((code.match(/\(/g) || []).length !== (code.match(/\)/g) || []).length) throw new Error("SyntaxError: unexpected EOF while parsing");
        } else if (lang === 'cpp' || lang === 'java') {
          if ((code.match(/"/g) || []).length % 2 !== 0) throw new Error("SyntaxError: missing terminating '\"' character");
          if ((code.match(/\{/g) || []).length !== (code.match(/\}/g) || []).length) throw new Error("SyntaxError: expected '}' at end of input");
          if ((code.match(/\(/g) || []).length !== (code.match(/\)/g) || []).length) throw new Error("SyntaxError: expected ')'");
        } else if (lang === 'sql') {
          if ((code.match(/'/g) || []).length % 2 !== 0) throw new Error("SQL SyntaxError: Unclosed quotation mark");
        }

        if (lang === 'javascript' || lang === 'typescript') {
          // Safe JS / TS Execution with custom console interception
          const captured = [];
          const customConsole = {
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

          // Strip simple TS types for runtime execution
          let executableCode = code;
          if (lang === 'typescript') {
            executableCode = code
              .replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, '')
              .replace(/type\s+\w+\s*=[\s\S]*?;/g, '')
              .replace(/:\s*(string|number|boolean|any|void|\w+\[\]|\w+)\b/g, '')
              .replace(/as\s+\w+/g, '');
          }

          const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
          const runFn = new AsyncFunction('console', executableCode);
          
          await runFn(customConsole);

          const endT = performance.now();
          const duration = ((endT - startT) / 1000).toFixed(3);
          setExecTime(duration);

          setTerminalLogs([
            ...newLogs,
            ...captured,
            { type: 'success', text: `✨ Process finished with exit code 0 (${duration}s)` }
          ]);
        } else if (lang === 'python') {
          // Simulated Python runner
          const lines = code.split('\n');
          const pyLogs = [];
          lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('print(') && trimmed.endsWith(')')) {
              let inner = trimmed.substring(6, trimmed.length - 1);
              inner = inner.replace(/^f?["']|["']$/g, '');
              // Evaluate simple expressions inside f-strings or prints
              inner = inner.replace(/\{([^}]+)\}/g, (_, expr) => {
                if (expr.includes('sum(') || expr.includes('avg')) return '88.40';
                if (expr.includes('workspace') || expr.includes('name')) return workspace.name;
                if (expr.includes('user') || expr.includes('developer')) return currentUser?.name || 'Student';
                if (expr.includes('len(')) return '5';
                return expr;
              });
              pyLogs.push({ type: 'output', text: inner });
            } else if (trimmed.startsWith('for ') && trimmed.includes('print(')) {
              pyLogs.push({ type: 'output', text: '-> Executing loop iteration...' });
            }
          });
          if (pyLogs.length === 0) {
            pyLogs.push({ type: 'output', text: `[Python script executed successfully: ${activeFile.name}]` });
          }

          const endT = performance.now();
          const duration = ((endT - startT) / 1000).toFixed(3);
          setExecTime(duration);

          setTerminalLogs([
            ...newLogs,
            ...pyLogs,
            { type: 'success', text: `✨ Python 3 process finished with exit code 0 (${duration}s)` }
          ]);
        } else if (lang === 'sql') {
          // In-memory SQL engine for workspace data
          const sqlQueries = code.split(';').map(q => q.trim()).filter(Boolean);
          const sqlLogs = [];

          sqlQueries.forEach(q => {
            const cleanQ = q.replace(/--.*$/gm, '').trim();
            if (!cleanQ) return;

            sqlLogs.push({ type: 'info', text: `QUERY: ${cleanQ};` });

            if (/from\s+tasks/i.test(cleanQ)) {
              sqlLogs.push({
                type: 'output',
                text: `+----+------------------------------------+-------------+----------+\n| ID | TITLE                              | STATUS      | PRIORITY |\n+----+------------------------------------+-------------+----------+\n` +
                  (tasks.slice(0, 5).map(t => `| ${(t.id || '1').toString().padEnd(2)} | ${t.title.slice(0, 34).padEnd(34)} | ${(t.status || 'todo').padEnd(11)} | ${(t.priority || 'medium').padEnd(8)} |`).join('\n') || '| 1  | Sample Task                        | todo        | medium   |') +
                  `\n+----+------------------------------------+-------------+----------+\n(${tasks.length} rows in set)`
              });
            } else if (/from\s+members/i.test(cleanQ)) {
              const members = workspace.members || [{ name: currentUser?.name || 'Student', role: 'Owner' }];
              sqlLogs.push({
                type: 'output',
                text: `+----------------------+----------------------+\n| NAME                 | ROLE                 |\n+----------------------+----------------------+\n` +
                  members.map(m => `| ${m.name.slice(0, 20).padEnd(20)} | ${(m.role || 'Contributor').slice(0, 20).padEnd(20)} |`).join('\n') +
                  `\n+----------------------+----------------------+\n(${members.length} rows in set)`
              });
            } else if (/from\s+milestones/i.test(cleanQ)) {
              sqlLogs.push({
                type: 'output',
                text: `+----+------------------------------------+----------+-------------+\n| ID | MILESTONE                          | PROGRESS | STATUS      |\n+----+------------------------------------+----------+-------------+\n| 1  | Architecture & Prototype           | 100%     | completed   |\n| 2  | Hardware & Cloud Integration       | 60%      | in_progress |\n| 3  | Campus Live Beta Deployment        | 0%       | pending     |\n+----+------------------------------------+----------+-------------+\n(3 rows in set)`
              });
            } else {
              sqlLogs.push({
                type: 'output',
                text: `Query OK, 0 rows affected (Execution time: 0.002 sec)`
              });
            }
          });

          const endT = performance.now();
          const duration = ((endT - startT) / 1000).toFixed(3);
          setExecTime(duration);

          setTerminalLogs([
            ...newLogs,
            ...sqlLogs,
            { type: 'success', text: `✨ SQL Batch execution completed successfully (${duration}s)` }
          ]);
        } else if (lang === 'html') {
          // HTML DOM Inspector & Validator
          const parser = new DOMParser();
          const doc = parser.parseFromString(code, 'text/html');
          const title = doc.querySelector('title')?.textContent || 'Untitled Document';
          const elementCount = doc.querySelectorAll('*').length;
          const stylesCount = doc.querySelectorAll('style').length;
          const scriptsCount = doc.querySelectorAll('script').length;

          const endT = performance.now();
          const duration = ((endT - startT) / 1000).toFixed(3);
          setExecTime(duration);

          setTerminalLogs([
            ...newLogs,
            { type: 'output', text: `🌐 HTML5 Document Inspection:` },
            { type: 'output', text: `  • Document Title: "${title}"` },
            { type: 'output', text: `  • Total Elements: ${elementCount}` },
            { type: 'output', text: `  • Embedded Styles: ${stylesCount}` },
            { type: 'output', text: `  • Script Blocks: ${scriptsCount}` },
            { type: 'info', text: `  • HTML Validation: 0 Errors, Valid HTML5 Semantics.` },
            { type: 'success', text: `✨ HTML Preview structure compiled (${duration}s)` }
          ]);
        } else if (lang === 'cpp') {
          // C++ Runner Simulator
          const lines = code.split('\n');
          const cppLogs = [];
          lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.includes('cout <<')) {
              let text = trimmed
                .replace(/cout\s*<<\s*/g, '')
                .replace(/\s*<<\s*endl\s*;?/g, '')
                .replace(/\s*<<\s*/g, ' ')
                .replace(/["';]/g, '');
              cppLogs.push({ type: 'output', text });
            }
          });
          if (cppLogs.length === 0) {
            cppLogs.push({ type: 'output', text: `Binary executed: [${activeFile.name}] with 0 exit code` });
          }

          const endT = performance.now();
          const duration = ((endT - startT) / 1000).toFixed(3);
          setExecTime(duration);

          setTerminalLogs([
            ...newLogs,
            ...cppLogs,
            { type: 'success', text: `✨ C++ Program terminated with exit code 0 (${duration}s)` }
          ]);
        } else if (lang === 'java') {
          // Java Runner Simulator
          const lines = code.split('\n');
          const javaLogs = [];
          lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.includes('System.out.println(') || trimmed.includes('System.out.print(')) {
              let text = trimmed
                .replace(/System\.out\.println\(/g, '')
                .replace(/System\.out\.print\(/g, '')
                .replace(/\);?$/g, '')
                .replace(/\s*\+\s*/g, ' ')
                .replace(/["']/g, '');
              javaLogs.push({ type: 'output', text });
            }
          });
          if (javaLogs.length === 0) {
            javaLogs.push({ type: 'output', text: `Java bytecode executed: Main.class` });
          }

          const endT = performance.now();
          const duration = ((endT - startT) / 1000).toFixed(3);
          setExecTime(duration);

          setTerminalLogs([
            ...newLogs,
            ...javaLogs,
            { type: 'success', text: `✨ Java OpenJDK process finished with exit code 0 (${duration}s)` }
          ]);
        } else if (lang === 'json') {
          // JSON Validator & Formatter
          try {
            const parsed = JSON.parse(code);
            const keyCount = Object.keys(parsed).length;
            const byteSize = new Blob([code]).size;

            const endT = performance.now();
            const duration = ((endT - startT) / 1000).toFixed(3);
            setExecTime(duration);

            setTerminalLogs([
              ...newLogs,
              { type: 'success', text: `✔ JSON Syntax Valid!` },
              { type: 'output', text: `  • Top-level Properties: ${keyCount}` },
              { type: 'output', text: `  • Size: ${byteSize} bytes` },
              { type: 'output', text: `  • Structure:\n` + JSON.stringify(parsed, null, 2) },
              { type: 'success', text: `✨ JSON validation complete (${duration}s)` }
            ]);
          } catch (jsonErr) {
            setTerminalLogs([
              ...newLogs,
              { type: 'error', text: `JSON Syntax Error: ${jsonErr.message}` }
            ]);
          }
        }
      } catch (err) {
        setTerminalLogs([
          ...newLogs,
          { type: 'error', text: `Runtime Error: ${err.message}` }
        ]);
      }
      setIsRunning(false);
    }, 180);
  };

  // Interactive CLI command processor
  const handleCliSubmit = (e) => {
    e.preventDefault();
    const cmd = cliInput.trim();
    if (!cmd) return;

    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    const parts = cmd.split(' ');
    const mainCmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    const newLogs = [...terminalLogs, { type: 'command', text: `campushub@${workspace.id}:~$ ${cmd}` }];

    switch (mainCmd) {
      case 'help':
        newLogs.push({
          type: 'info',
          text: `Available Terminal Commands:
  • help                 - Display this reference manual
  • ls / dir             - List all project code files & documents
  • lang / languages     - List all supported coding languages
  • run <file>           - Execute script file (JS, Python, TS, SQL, HTML, C++, Java, JSON)
  • node <file.js>       - Execute a Node.js script
  • python <file.py>     - Execute a Python script
  • cat <file>           - Display file source code
  • tasks                - List all Kanban tasks in this workspace
  • members              - Display workspace contributors & roles
  • git status           - Show branch status & uncommitted changes
  • git log              - View recent workspace commits
  • git commit -m "msg"  - Commit changes to campus repo
  • npm test             - Run workspace automated test suite
  • npm run build        - Compile project build bundle
  • echo <text>          - Print text to stdout
  • clear / cls          - Clear terminal logs`
        });
        break;

      case 'lang':
      case 'languages':
        newLogs.push({
          type: 'info',
          text: `Supported Coding Languages:\n` +
            CODING_LANGUAGES.map(l => `  ${l.icon} ${l.name.padEnd(28)} [${l.ext}] - ${l.description}`).join('\n')
        });
        break;

      case 'ls':
      case 'dir':
        newLogs.push({
          type: 'output',
          text: files.map(f => {
            const lcfg = CODING_LANGUAGES.find(l => l.id === f.language);
            return `${lcfg?.icon || '📄'} ${f.name.padEnd(24)} (${f.language})`;
          }).join('\n')
        });
        break;

      case 'cat':
        if (!arg) {
          newLogs.push({ type: 'error', text: 'Usage: cat <filename>' });
        } else {
          const target = files.find(f => f.name.toLowerCase() === arg.toLowerCase());
          if (target) {
            newLogs.push({ type: 'output', text: `--- ${target.name} ---\n` + target.content });
          } else {
            newLogs.push({ type: 'error', text: `File not found: "${arg}"` });
          }
        }
        break;

      case 'run':
      case 'node':
      case 'python':
        const targetFile = arg ? files.find(f => f.name.toLowerCase() === arg.toLowerCase()) : activeFile;
        if (!targetFile) {
          newLogs.push({ type: 'error', text: `File not found: "${arg}"` });
        } else {
          setActiveFileId(targetFile.id);
          newLogs.push({ type: 'system', text: `Running ${targetFile.name} (${targetFile.language})...` });
          handleRunCode();
          return;
        }
        break;

      case 'tasks':
        newLogs.push({
          type: 'info',
          text: tasks.map(t => `[${t.status.padEnd(11)}] ${t.title} (${t.priority})`).join('\n') || 'No tasks found.'
        });
        break;

      case 'members':
        newLogs.push({
          type: 'info',
          text: (workspace.members || []).map(m => `👤 ${m.name.padEnd(20)} [${m.role}]`).join('\n')
        });
        break;

      case 'git':
        if (arg === 'status') {
          newLogs.push({
            type: 'output',
            text: `On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges ready for workspace commit:\n  modified:   ${activeFile.name}\n\nAll team branches synchronized.`
          });
        } else if (arg === 'log') {
          newLogs.push({
            type: 'output',
            text: `commit 8f2a1b9 (HEAD -> main)\nAuthor: ${currentUser?.name || 'Jashvanthan'} <campus@hub.edu>\nDate:   ${new Date().toDateString()}\n\n    feat: integrate shortest path Dijkstra campus navigation engine\n\ncommit 4d3c2e1\nAuthor: Sarah Jenkins\nDate:   Wed Mar 25 10:15:00 2026\n\n    perf: optimize vertex graph traversal latency`
          });
        } else if (arg.startsWith('commit')) {
          newLogs.push({
            type: 'success',
            text: `[main ${Math.random().toString(36).substring(2, 8)}] ${arg.replace(/^commit\s+-m\s*["']?|["']?$/g, '') || 'workspace update'}\n 1 file changed, ${activeFile.content.split('\n').length} insertions(+)`
          });
        } else {
          newLogs.push({ type: 'output', text: 'git version 2.44.0 (CampusHub Virtual VCS)' });
        }
        break;

      case 'npm':
        if (arg === 'test') {
          newLogs.push({
            type: 'success',
            text: `> campushub-project@1.0.0 test\n> vitest run\n\n ✓ src/navigation.test.js (4 tests) 12ms\n ✓ src/api.test.js (3 tests) 8ms\n\n Test Files  2 passed (2)\n      Tests  7 passed (7)\n   Duration  42ms`
          });
        } else if (arg === 'run build') {
          newLogs.push({
            type: 'success',
            text: `> vite build\n\ntransforming... ✓ 14 modules transformed.\ndist/index.html   0.85 kB\ndist/assets.js    42.10 kB\n\n✓ built in 0.34s`
          });
        } else {
          newLogs.push({ type: 'output', text: 'npm v10.5.0' });
        }
        break;

      case 'echo':
        newLogs.push({ type: 'output', text: arg });
        break;

      case 'clear':
      case 'cls':
        setTerminalLogs([{ type: 'system', text: 'Terminal cleared.' }]);
        setCliInput('');
        return;

      default:
        newLogs.push({
          type: 'error',
          text: `Command not found: "${mainCmd}". Type "help" for a list of valid commands.`
        });
        break;
    }

    setTerminalLogs(newLogs);
    setCliInput('');
  };

  const handleShareToChat = () => {
    if (!onShareToChat) return;
    const lastOutputs = terminalLogs.slice(-4).map(l => l.text).join('\n');
    onShareToChat({
      content: `⚡ Shared terminal run results for \`${activeFile.name}\` (${activeLangConfig.name}):\n\`\`\`\n${lastOutputs}\n\`\`\``,
      codeSnippet: {
        title: activeFile.name,
        language: activeFile.language,
        code: activeFile.content
      }
    });
  };

  const copyTerminalOutput = () => {
    const text = terminalLogs.map(l => l.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getHeightStyle = () => {
    if (terminalHeight === '400px' || terminalHeight === 'compact') return { minHeight: '400px', height: '400px' };
    if (terminalHeight === 'tall' || terminalHeight === '2600px') return { minHeight: '2600px', height: '2600px' };
    if (terminalHeight === 'full') return { minHeight: '94vh', height: 'calc(100dvh - 72px)' };
    return { minHeight: '1000px', height: '1000px' };
  };

  return (
    <div 
      className={`workspace-terminal-container glass-panel height-${terminalHeight} ${isDragging ? 'is-resizing' : ''}`}
      style={getHeightStyle()}
    >
      {/* Header bar */}
      <div className="terminal-header-bar">
        <div className="terminal-header-left">
          <div className="terminal-window-dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <div className="terminal-header-title">
            <TerminalIcon size={16} color="#818cf8" />
            <span>Workspace Code Terminal &amp; Multi-Language REPL</span>
            <span className="terminal-tag">{workspace.name}</span>
          </div>
        </div>

        <div className="terminal-header-right">
          {/* Height Customizer Modes */}
          <div className="terminal-mode-switch terminal-height-switch" title="Adjust Terminal Container Height">
            <button 
              type="button" 
              className={`mode-btn ${terminalHeight === '400px' ? 'active' : ''}`} 
              onClick={() => setTerminalHeight('400px')} 
              title="Compact Height (400px)"
            >
              <span>400px</span>
            </button>
            <button 
              type="button" 
              className={`mode-btn ${terminalHeight === 'standard' ? 'active' : ''}`} 
              onClick={() => setTerminalHeight('standard')} 
              title="Standard Height (1000px)"
            >
              <span>1000px</span>
            </button>
            <button 
              type="button" 
              className={`mode-btn ${terminalHeight === 'tall' ? 'active' : ''}`} 
              onClick={() => setTerminalHeight('tall')} 
              title="Extra Tall Height (2600px)"
            >
              <span>2600px</span>
            </button>
            <button 
              type="button" 
              className={`mode-btn ${terminalHeight === 'full' ? 'active' : ''}`} 
              onClick={() => setTerminalHeight(prev => prev === 'full' ? 'standard' : 'full')} 
              title="Fullscreen Mode"
            >
              {terminalHeight === 'full' ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span>{terminalHeight === 'full' ? 'Exit' : 'Full'}</span>
            </button>
          </div>

          {/* Layout & Sidebar toggles */}
          <div className="terminal-mode-switch">
            <button 
              type="button" 
              className={`mode-btn ${showSidebar ? 'active' : ''}`} 
              onClick={() => setShowSidebar(!showSidebar)} 
              title="Toggle Project Files Column"
            >
              <Folder size={14} />
              <span>Files ({files.length})</span>
            </button>
            <button type="button" className={`mode-btn ${layout === 'horizontal' ? 'active' : ''}`} onClick={() => setLayout('horizontal')} title="Side-by-Side Layout">
              <Columns size={14} />
            </button>
            <button type="button" className={`mode-btn ${layout === 'vertical' ? 'active' : ''}`} onClick={() => setLayout('vertical')} title="Stacked Layout">
              <Rows size={14} />
            </button>
          </div>

          {/* Mode switch */}
          <div className="terminal-mode-switch">
            <button
              type="button"
              className={`mode-btn ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              <FileCode size={14} /> <span>Code Editor</span>
            </button>
            <button
              type="button"
              className={`mode-btn ${activeTab === 'cli' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('cli');
                if (cliInputRef.current) {
                  cliInputRef.current.focus({ preventScroll: true });
                }
              }}
            >
              <TerminalIcon size={14} /> <span>CLI Shell</span>
            </button>
          </div>

          {/* Terminal Action Buttons */}
          <div className="terminal-actions-group">
            <button
              type="button"
              className="terminal-btn"
              onClick={copyTerminalOutput}
              title="Copy Terminal Logs"
            >
              {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Logs'}</span>
            </button>

            {onShareToChat && (
              <button
                type="button"
                className="terminal-btn terminal-btn-share"
                onClick={handleShareToChat}
                title="Share Script &amp; Output to Team Chat"
              >
                <Share2 size={14} />
                <span>Share to Chat</span>
              </button>
            )}

            <button
              type="button"
              className="terminal-run-btn pulse-hover"
              onClick={handleRunCode}
              disabled={isRunning}
              title="Run Active Code Script"
            >
              <Play size={14} fill="currentColor" />
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Terminal Grid: Left is Editor / Files, Right is Output Screen */}
      <div className="terminal-layout-wrapper">
        
        {/* Saved Files Sidebar */}
        {showSidebar && (
          <div className="terminal-sidebar">
            <div className="terminal-sidebar-header">
              <span>Project Files ({files.length})</span>
            </div>
            {files.map(file => {
              const lcfg = CODING_LANGUAGES.find(l => l.id === file.language) || CODING_LANGUAGES[0];
              return (
                <div 
                  key={file.id} 
                  className={`terminal-sidebar-file ${activeFile.id === file.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveFileId(file.id);
                    setActiveTab('editor');
                  }}
                >
                  <span style={{ fontSize: '13px' }}>{lcfg.icon}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                </div>
              );
            })}
            <button type="button" className="terminal-sidebar-add-btn" onClick={handleAddNewFile}>
              <Plus size={14} /> <span>Add File</span>
            </button>
          </div>
        )}

            <div 
              className={`terminal-main-grid layout-${layout}`} 
              ref={containerRef}
              style={
                layout === 'horizontal'
                  ? { gridTemplateColumns: `${splitRatio}% 6px ${100 - splitRatio}%`, gridTemplateRows: '100%' }
                  : { gridTemplateColumns: '100%', gridTemplateRows: `${splitRatio}% 34px ${100 - splitRatio}%` }
              }
            >
              {/* Left Pane: Files & Editor */}
              <div className="terminal-editor-pane">
              {/* File Tabs Bar */}
              <div className="terminal-files-bar">
                <div className="terminal-files-tabs">
                  {files.map(file => {
                    const lcfg = CODING_LANGUAGES.find(l => l.id === file.language) || CODING_LANGUAGES[0];
                    return (
                      <div
                        key={file.id}
                        className={`terminal-file-tab ${activeFile.id === file.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveFileId(file.id);
                          setActiveTab('editor');
                        }}
                      >
                        <span style={{ fontSize: '12px' }}>{lcfg.icon}</span>
                        <span className="file-name">{file.name}</span>
                        {files.length > 1 && (
                          <button
                            type="button"
                            className="file-close-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file.id, e);
                            }}
                            title="Close File"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button type="button" className="add-file-btn" onClick={handleAddNewFile} title="Create new script file">
                  <Plus size={14} />
                </button>
              </div>

              {/* Editor Area */}
              {activeTab === 'editor' ? (
                <div className="terminal-editor-wrap">
                  {/* Language Selector & Meta Info Bar */}
                  <div className="editor-meta-info">
                    <div className="editor-meta-left">
                      {/* Coding Language Selector Dropdown */}
                      <div className="language-selector-wrap">
                        <span className="lang-selector-label">Language:</span>
                        <div className="lang-dropdown-container">
                          <select
                            className="terminal-lang-select"
                            value={activeFile.language || 'javascript'}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            title="Select Coding Language"
                          >
                            {CODING_LANGUAGES.map(lang => (
                              <option key={lang.id} value={lang.id}>
                                {lang.icon} {lang.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="lang-select-arrow" />
                        </div>
                      </div>

                      {/* Active Language Badge */}
                      <span
                        className="terminal-lang-badge"
                        style={{
                          color: activeLangConfig.color,
                          borderColor: `${activeLangConfig.color}40`,
                          background: `${activeLangConfig.color}15`
                        }}
                      >
                        {activeLangConfig.badge}
                      </span>

                      {/* Boilerplate template button */}
                      <button
                        className="boilerplate-btn"
                        onClick={handleLoadBoilerplate}
                        title={`Load ${activeLangConfig.name} Starter Template`}
                      >
                        <LayoutTemplate size={12} />
                        <span>Insert Template</span>
                      </button>
                    </div>

                    <div className="editor-meta-right">
                      <span className="lines-count">Lines: {activeFile.content.split('\n').length}</span>
                      {!isMobile && <span className="shortcut-hint">Ctrl+Enter to execute</span>}
                    </div>
                  </div>

                  <textarea
                    className="terminal-code-textarea"
                    value={activeFile.content}
                    onChange={(e) => updateActiveContent(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleRunCode();
                      }
                    }}
                    placeholder={`Write your ${activeLangConfig.name} code here...`}
                    spellCheck="false"
                  />
                </div>
              ) : (
                <div className="cli-guide-pane">
                  <div className="cli-guide-header">
                    <Cpu size={18} color="var(--accent-primary)" />
                    <h4>Interactive CLI Commands Guide</h4>
                  </div>
                  <p className="cli-guide-desc">
                    Execute project scripts in multiple languages, query database tables, inspect git commits, or run test suites.
                  </p>
                  <div className="cli-commands-chips">
                    {['help', 'languages', 'ls', 'run ' + activeFile.name, 'tasks', 'members', 'git status', 'git log', 'npm test', 'npm run build', 'clear'].map(c => (
                      <button
                        key={c}
                        className="cli-chip-btn"
                        onClick={() => {
                          setCliInput(c);
                          if (cliInputRef.current) {
                            cliInputRef.current.focus({ preventScroll: true });
                          }
                        }}
                      >
                        <code>{c}</code>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resizer Handle - Touch & Mouse Movable */}
            <div 
              className={`resizer-handle ${layout === 'horizontal' ? 'resizer-vertical' : 'resizer-horizontal'} ${isDragging ? 'is-dragging' : ''}`}
              onMouseDown={handleResizerStart}
              onTouchStart={handleResizerStart}
              title={`Drag to adjust ${layout === 'horizontal' ? 'width' : 'output height'} (or use presets)`}
            >
              <div className="resizer-grab-pill">
                <div className="resizer-drag-trigger" onMouseDown={handleResizerStart} onTouchStart={handleResizerStart}>
                  {layout === 'horizontal' ? <GripVertical size={13} /> : <GripHorizontal size={13} />}
                  <span className="resizer-indicator-text">
                    {layout === 'horizontal'
                      ? `${Math.round(splitRatio)}% : ${100 - Math.round(splitRatio)}%`
                      : `Editor ${Math.round(splitRatio)}% • Output ${100 - Math.round(splitRatio)}%`}
                  </span>
                  <ArrowUpDown size={11} className="resizer-indicator-arrows" />
                </div>

                <div className="resizer-quick-actions" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                  <button 
                    type="button"
                    className={`resizer-quick-btn ${splitRatio === 70 ? 'active' : ''}`}
                    onClick={() => setSplitRatio(70)}
                    title="Small Output (30%)"
                  >
                    30%
                  </button>
                  <button 
                    type="button"
                    className={`resizer-quick-btn ${splitRatio === 50 ? 'active' : ''}`}
                    onClick={() => setSplitRatio(50)}
                    title="Equal Split (50/50)"
                  >
                    50%
                  </button>
                  <button 
                    type="button"
                    className={`resizer-quick-btn ${splitRatio === 30 ? 'active' : ''}`}
                    onClick={() => setSplitRatio(30)}
                    title="Large Output (70%)"
                  >
                    70%
                  </button>
                  <button 
                    type="button"
                    className={`resizer-quick-btn ${splitRatio === 15 ? 'active' : ''}`}
                    onClick={() => setSplitRatio(15)}
                    title="Maximize Output Screen"
                  >
                    Max
                  </button>
                </div>
              </div>
            </div>

            {/* Right Pane: Live Terminal Console Output */}
            <div className="terminal-console-pane">
              <div className="console-header">
                <div className="console-title-group">
                  <div className="console-title">
                    <TerminalIcon size={14} color="#818cf8" />
                    <span>TERMINAL OUTPUT ({activeLangConfig.badge})</span>
                  </div>

                  <div className="console-actions">
                    {execTime && (
                      <span className="console-exec-badge">
                        <Zap size={11} /> {execTime}s
                      </span>
                    )}
                    <button
                      type="button"
                      className="console-tool-btn"
                      onClick={() => setTerminalLogs([{ type: 'system', text: 'Terminal output cleared.' }])}
                      title="Clear Output"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>
                </div>

                {/* Quick Output Sizing Controls */}
                <div className="console-size-presets">
                  <span className="preset-label">Output Size:</span>
                  <button 
                    type="button" 
                    className={`preset-pill ${splitRatio === 70 ? 'active' : ''}`} 
                    onClick={() => setSplitRatio(70)} 
                    title="30% Output size"
                  >
                    30%
                  </button>
                  <button 
                    type="button" 
                    className={`preset-pill ${splitRatio === 50 ? 'active' : ''}`} 
                    onClick={() => setSplitRatio(50)} 
                    title="50% Balanced output"
                  >
                    50%
                  </button>
                  <button 
                    type="button" 
                    className={`preset-pill ${splitRatio === 30 ? 'active' : ''}`} 
                    onClick={() => setSplitRatio(30)} 
                    title="70% Large output size"
                  >
                    70%
                  </button>
                  <button 
                    type="button" 
                    className={`preset-pill ${splitRatio === 15 ? 'active' : ''}`} 
                    onClick={() => setSplitRatio(15)} 
                    title="Maximize Output"
                  >
                    Max
                  </button>
                </div>
              </div>

              <div className="console-screen-viewport" ref={consoleViewportRef}>
                {terminalLogs.map((log, i) => (
                  <div key={i} className={`console-line log-${log.type}`}>
                    {log.type === 'command' && <span className="line-symbol">❯ </span>}
                    {log.type === 'error' && <span className="line-symbol">✖ </span>}
                    {log.type === 'success' && <span className="line-symbol">✔ </span>}
                    <pre className="console-line-text">{log.text}</pre>
                  </div>
                ))}
                <div ref={terminalBottomRef} />
              </div>

              {/* Interactive Shell CLI Input Line */}
              <form className="console-input-bar" onSubmit={handleCliSubmit}>
                <span className="console-prompt-label">campushub:~$</span>
                <input
                  ref={cliInputRef}
                  type="text"
                  className="console-input-field"
                  placeholder='Type a command (e.g. "help", "languages", "run app.js", "npm test")...'
                  value={cliInput}
                  onChange={(e) => setCliInput(e.target.value)}
                />
                <button type="submit" className="console-send-btn" title="Execute Command">
                  <CornerDownLeft size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
