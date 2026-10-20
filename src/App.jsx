import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { registerVerScriptLanguage } from './verscript-language.js';

const TEMPLATES = {
  starter: `! VerScript Studio - Standalone Offline Desktop IDE
! Press [▶ Run File] or experiment live in the interactive REPL below!

load Math
load Matrix

func calculateArea(radius: num):
    set area: PI * (radius ^ 2)
    display "Calculated Circle Area: " + area ?color=green
    reply area

calculateArea(5)

! Interactive prompt demonstration:
prompt userName ?default="Explorer"
display "Greetings, " + userName + "! Welcome to VerScript Studio." ?color=cyan
`,

  header: `! Interface Contract Specification Header
pragma once
pragma strict

header StorageEngine:
    func initialize(endpoint: str): bool
    func writeBlock(blockId: str, data: str): bool
    func readBlock(blockId: str): str
    func close(): bool

struct StorageConfig:
    retries: num
    timeoutMs: num
    useCache: bool
`,

  oop: `! Object-Oriented Class Example in VerScript
class Particle:
    dynamic:
        num x
        num y
        num velocity

        def func constructor(startX: num, startY: num, speed: num):
            set this.x: startX
            set this.y: startY
            set this.velocity: speed

        def func move():
            set this.x: this.x + this.velocity
            set this.y: this.y + this.velocity
            display "Particle at (" + this.x + ", " + this.y + ")" ?color=yellow

inst p: Particle(0, 0, 1.5)
p.move()
p.move()
`,

  matrix: `! High-Performance Matrix Operations & Linear Algebra
load Matrix

set A: [[4, 7], [2, 6]]
display "Matrix A:" ?color=cyan
display A

set detA: Matrix.det(A)
display "Determinant: " + detA ?color=green

set invA: Matrix.inverse(A)
display "Inverse Matrix:" ?color=yellow
display invA

set identity: Matrix.identity(3)
display "3x3 Identity Matrix:" ?color=purple
display identity
`
};

export default function App() {
  const [tabs, setTabs] = useState([
    { id: '1', title: 'main.vrs', content: TEMPLATES.starter, path: null, modified: false }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [symbols, setSymbols] = useState([]);
  const [sidebarTab, setSidebarTab] = useState('symbols'); // 'symbols' | 'files'
  const [fontSize, setFontSize] = useState(14);

  // Runner & Dock State
  const [dockTab, setDockTab] = useState('repl'); // 'repl' | 'runner' | 'installer'
  const [cliArgs, setCliArgs] = useState('');
  const [runLogs, setRunLogs] = useState('');
  const [replLogs, setReplLogs] = useState('');
  const [installLogs, setInstallLogs] = useState('');
  const [stdinInput, setStdinInput] = useState('');
  const [replInput, setReplInput] = useState('');
  const [replHistory, setReplHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  // Performance & Status Metrics
  const [lastRunDuration, setLastRunDuration] = useState(null);
  const [lastExitCode, setLastExitCode] = useState(null);

  // Binary info
  const [binaryInfo, setBinaryInfo] = useState({ found: false, path: null, source: 'none', version: null });
  const [isRunning, setIsRunning] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // VS# State
  const [isVSSharpOpen, setIsVSSharpOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [vsSharpQuery, setVsSharpQuery] = useState('');
  const [vsSharpLoading, setVsSharpLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am **VS#**, your intelligent VerScript assistant. Note: VS# requires an active internet connection to query neural cloud models.'
    }
  ]);

  const editorRef = useRef(null);
  const runOutputRef = useRef(null);
  const replOutputRef = useRef(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // 1. Initial System Check & Event Listeners
  useEffect(() => {
    checkBinary();
    checkConnectivity();

    const onlineInterval = setInterval(checkConnectivity, 8000);

    if (window.electronAPI) {
      const unsubRun = window.electronAPI.onRunOutput((data) => {
        setRunLogs(prev => prev + data);
      });
      const unsubRepl = window.electronAPI.onReplData((data) => {
        setReplLogs(prev => prev + data);
      });
      const unsubInstall = window.electronAPI.onInstallLog((data) => {
        setInstallLogs(prev => prev + data);
      });

      window.electronAPI.startRepl();

      return () => {
        clearInterval(onlineInterval);
        unsubRun && unsubRun();
        unsubRepl && unsubRepl();
        unsubInstall && unsubInstall();
      };
    }

    return () => clearInterval(onlineInterval);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (runOutputRef.current) {
      runOutputRef.current.scrollTop = runOutputRef.current.scrollHeight;
    }
  }, [runLogs]);

  useEffect(() => {
    if (replOutputRef.current) {
      replOutputRef.current.scrollTop = replOutputRef.current.scrollHeight;
    }
  }, [replLogs]);

  // Update symbols whenever active tab content changes
  useEffect(() => {
    if (!activeTab) return;
    const lines = activeTab.content.split('\n');
    const detected = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const fnMatch = trimmed.match(/^(?:def\s+)?func\s+([a-zA-Z_]\w*)/);
      if (fnMatch) detected.push({ name: fnMatch[1], type: 'func', line: index + 1 });

      const clsMatch = trimmed.match(/^class\s+([a-zA-Z_]\w*)/);
      if (clsMatch) detected.push({ name: clsMatch[1], type: 'class', line: index + 1 });

      const hdrMatch = trimmed.match(/^header\s+([a-zA-Z_]\w*)/);
      if (hdrMatch) detected.push({ name: hdrMatch[1], type: 'header', line: index + 1 });

      const structMatch = trimmed.match(/^struct\s+([a-zA-Z_]\w*)/);
      if (structMatch) detected.push({ name: structMatch[1], type: 'struct', line: index + 1 });
    });

    setSymbols(detected);
  }, [activeTab?.content]);

  const checkBinary = async () => {
    if (window.electronAPI) {
      const info = await window.electronAPI.getBinaryInfo();
      setBinaryInfo(info);
    }
  };

  const checkConnectivity = async () => {
    if (window.electronAPI) {
      const online = await window.electronAPI.checkOnline();
      setIsOnline(online);
    } else {
      setIsOnline(navigator.onLine);
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    registerVerScriptLanguage(monaco);
    monaco.editor.setTheme('vs-dark');
  };

  const updateContent = (val) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, content: val, modified: true } : t));
  };

  const handleNewFile = (templateKey = 'starter') => {
    const newId = String(Date.now());
    const isHdr = templateKey === 'header';
    const filename = isHdr ? `contract_${tabs.length + 1}.h.vrs` : `script_${tabs.length + 1}.vrs`;
    const newTab = {
      id: newId,
      title: filename,
      content: TEMPLATES[templateKey] || '! New VerScript File\n',
      path: null,
      modified: false
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const handleOpenFile = async () => {
    if (!window.electronAPI) return;
    const file = await window.electronAPI.openFile();
    if (!file) return;

    const existing = tabs.find(t => t.path === file.filePath);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }

    const newTab = {
      id: String(Date.now()),
      title: file.name,
      content: file.content,
      path: file.filePath,
      modified: false
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleSaveFile = async () => {
    if (!window.electronAPI || !activeTab) return;
    if (activeTab.path) {
      await window.electronAPI.saveFile({ filePath: activeTab.path, content: activeTab.content });
      setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, modified: false } : t));
    } else {
      const saved = await window.electronAPI.saveFileAs({ content: activeTab.content, defaultName: activeTab.title });
      if (saved) {
        setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, path: saved.filePath, title: saved.name, modified: false } : t));
      }
    }
  };

  const handleRunCode = async () => {
    if (!window.electronAPI) return;
    setDockTab('runner');
    setRunLogs('');
    setIsRunning(true);
    setLastExitCode(null);
    setLastRunDuration(null);

    const startTime = performance.now();
    const res = await window.electronAPI.runCode({ code: activeTab.content, args: cliArgs });
    const elapsed = (performance.now() - startTime).toFixed(1);

    setIsRunning(false);
    setLastRunDuration(elapsed);
    setLastExitCode(res.exitCode !== undefined ? res.exitCode : (res.success ? 0 : 1));
  };

  const handleKillRun = async () => {
    if (window.electronAPI) {
      await window.electronAPI.killRun();
      setIsRunning(false);
    }
  };

  const handleSendStdin = async (e) => {
    if (e) e.preventDefault();
    if (!stdinInput.trim() || !window.electronAPI) return;
    await window.electronAPI.sendStdinInput(stdinInput);
    setRunLogs(prev => prev + `> ${stdinInput}\n`);
    setStdinInput('');
  };

  const handleSendRepl = async (e, directCmd = null) => {
    if (e) e.preventDefault();
    const cmd = directCmd || replInput;
    if (!cmd.trim() || !window.electronAPI) return;
    
    setReplHistory(prev => [...prev, cmd]);
    setHistoryIdx(-1);
    if (!directCmd) setReplInput('');

    if (cmd === 'clear') {
      setReplLogs('');
      return;
    }

    await window.electronAPI.sendReplInput(cmd);
  };

  const handleReplKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (replHistory.length > 0) {
        const nextIdx = historyIdx === -1 ? replHistory.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setReplInput(replHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx >= replHistory.length) {
          setHistoryIdx(-1);
          setReplInput('');
        } else {
          setHistoryIdx(nextIdx);
          setReplInput(replHistory[nextIdx]);
        }
      }
    }
  };

  const handleInstallVerScript = async () => {
    if (!window.electronAPI) return;
    setDockTab('installer');
    setInstallLogs('[VerScript Studio] Downloading & running latest install.ps1 from official repo...\n');
    setIsInstalling(true);
    await window.electronAPI.installVerScript();
    setIsInstalling(false);
    await checkBinary();
  };

  const handleRestartRepl = async () => {
    if (!window.electronAPI) return;
    setReplLogs('[Restarting VerScript REPL session...]\n');
    await window.electronAPI.killRepl();
    await window.electronAPI.startRepl();
  };

  const handleAskVSSharp = async (promptOverride = null) => {
    const q = promptOverride || vsSharpQuery;
    if (!q.trim() || vsSharpLoading) return;

    if (!isOnline) {
      setChatMessages(prev => [
        ...prev,
        { sender: 'user', text: q },
        { sender: 'assistant', text: '⚠️ **Network Offline**: VS# AI Assistant requires an active internet connection to communicate with the neural backend. Please connect your computer to the internet.' }
      ]);
      if (!promptOverride) setVsSharpQuery('');
      return;
    }

    setChatMessages(prev => [...prev, { sender: 'user', text: q }]);
    if (!promptOverride) setVsSharpQuery('');
    setVsSharpLoading(true);

    const res = await window.electronAPI.queryVSSharp({ prompt: q, code: activeTab.content });
    setVsSharpLoading(false);

    if (res.success) {
      setChatMessages(prev => [...prev, { sender: 'assistant', text: res.response }]);
    } else {
      setChatMessages(prev => [...prev, { sender: 'assistant', text: `❌ ${res.error}` }]);
    }
  };

  const jumpToLine = (line) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: 1 });
      editorRef.current.focus();
    }
  };

  return (
    <div className="studio-container">
      {/* 1. Header Toolbar */}
      <header className="studio-header">
        <div className="brand-section">
          <div className="logo-badge">
            <div className="logo-icon">V</div>
            <span>VerScript Studio</span>
          </div>
          <span className="version-pill">
            {binaryInfo.found ? `${binaryInfo.version} (${binaryInfo.source})` : 'No Binary Detected'}
          </span>
          {!binaryInfo.found && (
            <button className="btn btn-primary" onClick={handleInstallVerScript} disabled={isInstalling}>
              ⚡ Auto-Install VerScript
            </button>
          )}
        </div>

        <div className="toolbar-actions">
          {/* Template Dropdown */}
          <div className="template-dropdown-wrapper">
            <button className="btn btn-secondary" onClick={() => handleNewFile('starter')}>+ New File</button>
            <select 
              className="template-select" 
              onChange={(e) => {
                if (e.target.value) {
                  handleNewFile(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>Templates ▾</option>
              <option value="starter">Basic Script</option>
              <option value="header">Header Contract (.h.vrs)</option>
              <option value="oop">Object-Oriented Class</option>
              <option value="matrix">Matrix & Linear Algebra</option>
            </select>
          </div>

          <button className="btn btn-secondary" onClick={handleOpenFile}>Open</button>
          <button className="btn btn-secondary" onClick={handleSaveFile}>
            Save {activeTab?.modified ? '•' : ''}
          </button>
          
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />

          {/* Font Zoom Controls */}
          <button className="btn btn-secondary" style={{ padding: '6px 8px' }} onClick={() => setFontSize(f => Math.max(10, f - 1))}>A-</button>
          <button className="btn btn-secondary" style={{ padding: '6px 8px' }} onClick={() => setFontSize(f => Math.min(26, f + 1))}>A+</button>

          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />

          {isRunning ? (
            <button className="btn btn-danger" onClick={handleKillRun}>⏹ Stop</button>
          ) : (
            <button className="btn btn-success" onClick={handleRunCode}>▶ Run File</button>
          )}

          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />

          <button 
            className={`btn btn-secondary ${isVSSharpOpen ? 'active' : ''}`}
            onClick={() => setIsVSSharpOpen(!isVSSharpOpen)}
          >
            🤖 VS# AI
            <span className={`status-badge ${isOnline ? 'status-online' : 'status-offline'}`} style={{ marginLeft: 4 }}>
              <span className={`pulse-dot ${isOnline ? 'pulse-online' : 'pulse-offline'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </button>
        </div>
      </header>

      {/* 2. Main Work Area (Dual-Deck) */}
      <div className="studio-body">
        {/* Left: Dual Sidebar (Outline & Symbols OR Files) */}
        <aside className="symbols-sidebar">
          <div className="sidebar-tab-header">
            <button 
              className={`sidebar-tab-btn ${sidebarTab === 'symbols' ? 'active' : ''}`}
              onClick={() => setSidebarTab('symbols')}
            >
              Symbols ({symbols.length})
            </button>
            <button 
              className={`sidebar-tab-btn ${sidebarTab === 'files' ? 'active' : ''}`}
              onClick={() => setSidebarTab('files')}
            >
              Files ({tabs.length})
            </button>
          </div>

          {sidebarTab === 'symbols' ? (
            <div className="symbols-list">
              {symbols.length === 0 ? (
                <div style={{ padding: '14px 10px', fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}>
                  No functions, classes, or contracts declared in this file yet.
                </div>
              ) : (
                symbols.map((sym, idx) => (
                  <div key={idx} className="symbol-item" onClick={() => jumpToLine(sym.line)}>
                    <span className={`symbol-badge badge-${sym.type === 'func' ? 'fn' : sym.type === 'class' ? 'cls' : sym.type === 'header' ? 'hdr' : 'str'}`}>
                      {sym.type.slice(0, 3).toUpperCase()}
                    </span>
                    <span>{sym.name}</span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="symbols-list">
              {tabs.map((tab) => (
                <div 
                  key={tab.id} 
                  className={`symbol-item ${tab.id === activeTabId ? 'active-file-item' : ''}`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span style={{ fontSize: 13 }}>📄</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tab.title}
                  </span>
                  {tab.modified && <span style={{ color: 'var(--accent-cyan)' }}>•</span>}
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Center: Main Deck */}
        <main className="main-deck">
          {/* Top Deck: Tabs + Monaco Editor */}
          <section className="editor-deck">
            <div className="tabs-bar">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span>{tab.title} {tab.modified ? '•' : ''}</span>
                  {tabs.length > 1 && (
                    <span 
                      className="tab-close" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setTabs(prev => prev.filter(t => t.id !== tab.id));
                        if (activeTabId === tab.id) {
                          const remaining = tabs.filter(t => t.id !== tab.id);
                          if (remaining.length > 0) setActiveTabId(remaining[0].id);
                        }
                      }}
                    >
                      ×
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="editor-wrapper">
              <Editor
                height="100%"
                language="verscript"
                theme="vs-dark"
                value={activeTab?.content || ''}
                onChange={updateContent}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: fontSize,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontLigatures: true,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  automaticLayout: true,
                  lineNumbersMinChars: 3,
                  renderWhitespace: 'selection'
                }}
              />
            </div>
          </section>

          {/* Bottom Deck: Split Interactive Dock (REPL, Runner, Installer) */}
          <section className="bottom-dock">
            <div className="dock-header">
              <div className="dock-tabs">
                <button 
                  className={`dock-tab-btn ${dockTab === 'repl' ? 'active' : ''}`}
                  onClick={() => setDockTab('repl')}
                >
                  💻 Interactive REPL (verscript)
                </button>
                <button 
                  className={`dock-tab-btn ${dockTab === 'runner' ? 'active' : ''}`}
                  onClick={() => setDockTab('runner')}
                >
                  ▶ Run File Output
                </button>
                <button 
                  className={`dock-tab-btn ${dockTab === 'installer' ? 'active' : ''}`}
                  onClick={() => setDockTab('installer')}
                >
                  ⚙ Installer & System Logs
                </button>
              </div>

              {/* Execution Metrics Pill */}
              {dockTab === 'runner' && lastExitCode !== null && (
                <div className="metrics-pill">
                  <span className={`exit-badge ${lastExitCode === 0 ? 'exit-ok' : 'exit-err'}`}>
                    {lastExitCode === 0 ? '✓ Exited (0)' : `✕ Exited (${lastExitCode})`}
                  </span>
                  {lastRunDuration && (
                    <span className="duration-badge">⏱ {lastRunDuration} ms</span>
                  )}
                </div>
              )}

              {dockTab === 'repl' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => handleSendRepl(null, 'vars')}>
                    vars
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => handleSendRepl(null, 'help')}>
                    help
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: 11 }} onClick={handleRestartRepl}>
                    Restart
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => setReplLogs('')}>
                    Clear
                  </button>
                </div>
              )}

              {dockTab === 'runner' && (
                <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => setRunLogs('')}>
                  Clear
                </button>
              )}
            </div>

            {/* Dock Content: Tab 1 REPL */}
            {dockTab === 'repl' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div className="terminal-viewport" ref={replOutputRef}>
                  {replLogs || 'Starting VerScript Interactive Shell...\n'}
                </div>
                <form className="terminal-input-bar" onSubmit={handleSendRepl}>
                  <span className="terminal-prompt-prefix">&gt;&gt;&gt;</span>
                  <input
                    type="text"
                    className="terminal-text-input"
                    placeholder="Type expression (e.g. 10 * 42, vars, Matrix.identity(3)) or statement and press Enter..."
                    value={replInput}
                    onChange={(e) => setReplInput(e.target.value)}
                    onKeyDown={handleReplKeyDown}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 11 }}>
                    Send
                  </button>
                </form>
              </div>
            )}

            {/* Dock Content: Tab 2 Runner */}
            {dockTab === 'runner' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                {/* CLI Arguments Sub-bar */}
                <div className="cli-args-bar">
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>CLI Args:</span>
                  <input 
                    type="text" 
                    className="cli-args-input" 
                    placeholder="Optional arguments passed to script (e.g. --verbose input.csv)" 
                    value={cliArgs}
                    onChange={(e) => setCliArgs(e.target.value)}
                  />
                </div>

                <div className="terminal-viewport" ref={runOutputRef}>
                  {runLogs || 'Press [▶ Run File] in the top toolbar to execute the currently active file.'}
                </div>

                <form className="terminal-input-bar" onSubmit={handleSendStdin}>
                  <span className="terminal-prompt-prefix">stdin:</span>
                  <input
                    type="text"
                    className="terminal-text-input"
                    placeholder="Provide input for 'prompt' statement..."
                    value={stdinInput}
                    onChange={(e) => setStdinInput(e.target.value)}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>
                    Send Input
                  </button>
                </form>
              </div>
            )}

            {/* Dock Content: Tab 3 Installer Logs */}
            {dockTab === 'installer' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div className="terminal-viewport">
                  {installLogs || 'No installer logs. If VerScript is missing, click [Auto-Install VerScript] in the toolbar.'}
                </div>
              </div>
            )}
          </section>
        </main>

        {/* Right: Collapsible VS# Copilot Panel */}
        {isVSSharpOpen && (
          <aside className="vssharp-sidebar">
            <div className="vssharp-header">
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>VS# Copilot</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Online AI Assistant</div>
              </div>
              <span className={`status-badge ${isOnline ? 'status-online' : 'status-offline'}`}>
                <span className={`pulse-dot ${isOnline ? 'pulse-online' : 'pulse-offline'}`} />
                {isOnline ? 'Online' : 'Offline (Required)'}
              </span>
            </div>

            {/* Quick Action Chips */}
            <div className="vssharp-chips-row">
              <button 
                className="chip-btn" 
                onClick={() => handleAskVSSharp("Explain what this VerScript code does step by step.")}
                disabled={!isOnline || vsSharpLoading}
              >
                💡 Explain
              </button>
              <button 
                className="chip-btn" 
                onClick={() => handleAskVSSharp("Add explicit type annotations and contract constraints to this code.")}
                disabled={!isOnline || vsSharpLoading}
              >
                🛡 Types
              </button>
              <button 
                className="chip-btn" 
                onClick={() => handleAskVSSharp("Generate unit test assertions using 'Assert' standard library for this code.")}
                disabled={!isOnline || vsSharpLoading}
              >
                🧪 Tests
              </button>
            </div>

            <div className="vssharp-chat">
              {!isOnline && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: 10,
                  borderRadius: 6,
                  fontSize: 11.5,
                  color: '#fca5a5'
                }}>
                  ⚠️ <strong>Internet Required:</strong> VS# AI features operate in the cloud and cannot function offline. Please connect to the internet.
                </div>
              )}
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble chat-${msg.sender}`}>
                  {msg.text}
                </div>
              ))}
              {vsSharpLoading && (
                <div className="chat-bubble chat-assistant" style={{ fontStyle: 'italic', color: 'var(--accent-cyan)' }}>
                  VS# is thinking...
                </div>
              )}
            </div>

            <form className="vssharp-input-area" onSubmit={(e) => { e.preventDefault(); handleAskVSSharp(); }}>
              <textarea
                className="vssharp-textarea"
                placeholder={isOnline ? "Ask VS# about your VerScript code..." : "VS# is offline (Internet connection required)"}
                value={vsSharpQuery}
                onChange={(e) => setVsSharpQuery(e.target.value)}
                disabled={!isOnline || vsSharpLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAskVSSharp();
                  }
                }}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ alignSelf: 'flex-end', fontSize: 11 }}
                disabled={!isOnline || vsSharpLoading}
              >
                Send to VS#
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
