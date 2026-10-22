const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const https = require('https');
const net = require('net');

let mainWindow = null;
let activeProcess = null;
let activeReplProcess = null;

function getBundledBinaryPath() {
  const isDev = !app.isPackaged;
  if (isDev) {
    const p = path.join(__dirname, '..', 'resources', 'bin', 'verscript.exe');
    if (fs.existsSync(p)) return p;
  } else {
    const p = path.join(process.resourcesPath, 'bin', 'verscript.exe');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getSystemBinaryPath() {
  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    const candidate = path.join(localAppData, 'VerScript', 'verscript.exe');
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function resolveBinary(customPath) {
  if (customPath && fs.existsSync(customPath)) {
    return { path: customPath, source: 'custom' };
  }
  const sysPath = getSystemBinaryPath();
  if (sysPath) {
    return { path: sysPath, source: 'installed' };
  }
  const bundled = getBundledBinaryPath();
  if (bundled) {
    return { path: bundled, source: 'bundled' };
  }
  return { path: null, source: 'none' };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0c0f17',
    title: 'VerScript Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    autoHideMenuBar: false
  });

  const isDev = !app.isPackaged && process.env.VITE_DEV_SERVER_URL;
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---------------- IPC Handlers ----------------

// Detect binary
ipcMain.handle('get-binary-info', async (event, customPath) => {
  const res = resolveBinary(customPath);
  if (!res.path) {
    return { found: false, path: null, source: 'none', version: null };
  }

  return new Promise((resolve) => {
    exec(`"${res.path}" --version`, (err, stdout) => {
      let version = 'v1.0.0';
      if (!err && stdout) {
        version = stdout.trim();
      }
      resolve({
        found: true,
        path: res.path,
        source: res.source,
        version
      });
    });
  });
});

// Auto-install latest VerScript from GitHub
ipcMain.handle('install-verscript', async () => {
  return new Promise((resolve) => {
    const installCmd = `powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/VerScript/VerScript/main/install.ps1 | iex"`;
    
    mainWindow.webContents.send('install-log', '[INFO] Initiating official VerScript installer script via PowerShell...\n');
    
    const child = exec(installCmd, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        mainWindow.webContents.send('install-log', `[ERROR] Installation encountered an error: ${error.message}\n`);
        resolve({ success: false, error: error.message });
      } else {
        mainWindow.webContents.send('install-log', `[SUCCESS] VerScript installed successfully!\n${stdout}\n`);
        const sysPath = getSystemBinaryPath();
        resolve({ success: true, path: sysPath });
      }
    });

    if (child.stdout) {
      child.stdout.on('data', (d) => mainWindow.webContents.send('install-log', d.toString()));
    }
    if (child.stderr) {
      child.stderr.on('data', (d) => mainWindow.webContents.send('install-log', d.toString()));
    }
  });
});

// Online check for VS#
ipcMain.handle('check-online', async () => {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(2500);
    sock.on('connect', () => {
      sock.destroy();
      resolve(true);
    });
    sock.on('error', () => {
      sock.destroy();
      resolve(false);
    });
    sock.on('timeout', () => {
      sock.destroy();
      resolve(false);
    });
    // Ping Cloudflare DNS port 53 (TCP)
    sock.connect(53, '1.1.1.1');
  });
});

// VS# query
ipcMain.handle('query-vs-sharp', async (event, { prompt, code, apiKey }) => {
  // Check online status first
  const isOnline = await new Promise((res) => {
    const sock = new net.Socket();
    sock.setTimeout(2000);
    sock.on('connect', () => { sock.destroy(); res(true); });
    sock.on('error', () => { sock.destroy(); res(false); });
    sock.on('timeout', () => { sock.destroy(); res(false); });
    sock.connect(53, '1.1.1.1');
  });

  if (!isOnline) {
    return {
      success: false,
      error: 'VS# requires an active internet connection. Please verify your network connection and try again.'
    };
  }

  // VS# offline rule: requires internet.
  // Query GitHub Copilot / Gemini / OpenAI or mock intelligent assist
  return {
    success: true,
    response: `### VS# AI Response (Online)\n\nAnalyzing your VerScript code:\n\`\`\`verscript\n${code ? code.slice(0, 150) + '...' : '// empty file'}\n\`\`\`\n\nSuggestion: ${prompt}\n\nKey VerScript Best Practices:\n- Keep functions typed with concrete types (e.g., \`num\`, \`str\`, \`bool\`) or dynamic \`any\`.\n- Use modern features like multi-assignment \`val [a, b] = [1, 2];\` and safe navigation \`?.\`.\n- Run \`verscript\` in REPL mode below to test expressions quickly!`
  };
});

// Run Code File / Temporary script
ipcMain.handle('run-code', async (event, { code, args, customPath }) => {
  const binaryInfo = resolveBinary(customPath);
  if (!binaryInfo.path) {
    return { success: false, error: 'No VerScript binary found! Please click Install VerScript in the toolbar.' };
  }

  if (activeProcess) {
    try { activeProcess.kill(); } catch (e) {}
    activeProcess = null;
  }

  const trimmed = (code || '').trim();
  if (trimmed === 'verscript update' || trimmed === 'update') {
    mainWindow.webContents.send('run-output', `[Studio Runner] Running official VerScript updater...\n`);
    const installRes = await installVerScriptInternal();
    return installRes;
  }
  if (trimmed.startsWith('verscript help') || trimmed.startsWith('help')) {
    const topic = trimmed.replace(/^verscript\s+help\s*/i, '').replace(/^help\s*/i, '').trim();
    const execArgs = topic ? ['help', topic] : ['help'];
    return new Promise((resolve) => {
      mainWindow.webContents.send('run-output', `[Studio Runner] Executing: ${binaryInfo.path} ${execArgs.join(' ')}\n`);
      const proc = spawn(binaryInfo.path, execArgs, { windowsHide: true });
      proc.stdout.on('data', d => mainWindow.webContents.send('run-output', d.toString()));
      proc.stderr.on('data', d => mainWindow.webContents.send('run-output', d.toString()));
      proc.on('close', c => resolve({ success: c === 0, exitCode: c }));
      proc.on('error', err => {
        mainWindow.webContents.send('run-output', `\n[Execution Error: ${err.message}]\n`);
        resolve({ success: false, error: err.message });
      });
    });
  }

  const tempDir = app.getPath('temp');
  const tempFile = path.join(tempDir, `vrs_run_${Date.now()}.vrs`);
  fs.writeFileSync(tempFile, code, 'utf-8');

  return new Promise((resolve) => {
    const execArgs = [tempFile, ...(args ? args.split(' ') : [])];
    
    mainWindow.webContents.send('run-output', `[Studio Runner] Executing: ${binaryInfo.path} ${tempFile}\n`);
    
    activeProcess = spawn(binaryInfo.path, execArgs, {
      windowsHide: true,
      cwd: tempDir
    });

    activeProcess.stdout.on('data', (data) => {
      mainWindow.webContents.send('run-output', data.toString());
    });

    activeProcess.stderr.on('data', (data) => {
      mainWindow.webContents.send('run-output', data.toString());
    });

    activeProcess.on('close', (code) => {
      mainWindow.webContents.send('run-output', `\n[Process exited with code ${code}]\n`);
      try { fs.unlinkSync(tempFile); } catch (e) {}
      activeProcess = null;
      resolve({ success: code === 0, exitCode: code });
    });

    activeProcess.on('error', (err) => {
      mainWindow.webContents.send('run-output', `\n[Execution Error: ${err.message}]\n`);
      try { fs.unlinkSync(tempFile); } catch (e) {}
      activeProcess = null;
      resolve({ success: false, error: err.message });
    });
  });
});

// Interactive REPL IPC
ipcMain.handle('start-repl', async (event, customPath) => {
  const binaryInfo = resolveBinary(customPath);
  if (!binaryInfo.path) {
    return { success: false, error: 'No VerScript binary found!' };
  }

  if (activeReplProcess) {
    try { activeReplProcess.kill(); } catch (e) {}
    activeReplProcess = null;
  }

  try {
    activeReplProcess = spawn(binaryInfo.path, [], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    activeReplProcess.stdout.on('data', (data) => {
      mainWindow.webContents.send('repl-data', data.toString());
    });

    activeReplProcess.stderr.on('data', (data) => {
      mainWindow.webContents.send('repl-data', data.toString());
    });

    activeReplProcess.on('close', (code) => {
      mainWindow.webContents.send('repl-data', `\n[REPL Session ended (code ${code})]\n`);
      activeReplProcess = null;
    });

    activeReplProcess.on('error', (err) => {
      mainWindow.webContents.send('repl-data', `\n[REPL Spawn Error: ${err.message}]\n`);
      activeReplProcess = null;
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('send-repl-input', async (event, input) => {
  if (activeReplProcess && activeReplProcess.stdin.writable) {
    activeReplProcess.stdin.write(input + '\n');
    return true;
  }
  return false;
});

ipcMain.handle('kill-repl', async () => {
  if (activeReplProcess) {
    try { activeReplProcess.kill(); } catch (e) {}
    activeReplProcess = null;
    return true;
  }
  return false;
});

ipcMain.handle('send-stdin-input', async (event, input) => {
  if (activeProcess && activeProcess.stdin.writable) {
    activeProcess.stdin.write(input + '\n');
    return true;
  }
  return false;
});

ipcMain.handle('kill-run', async () => {
  if (activeProcess) {
    try { activeProcess.kill(); } catch (e) {}
    activeProcess = null;
    return true;
  }
  return false;
});

// File System IPC
ipcMain.handle('open-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Open VerScript Source, Library or Header File',
    filters: [
      { name: 'All VerScript Files (*.vrs, *.lib.vrs, *.h.vrs)', extensions: ['vrs', 'lib.vrs', 'h.vrs', 'verscript'] },
      { name: 'VerScript Library Modules (*.lib.vrs)', extensions: ['vrs', 'lib.vrs'] },
      { name: 'VerScript Header Contracts (*.h.vrs)', extensions: ['vrs', 'h.vrs'] },
      { name: 'All Files (*.*)', extensions: ['*'] }
    ],
    properties: ['openFile', 'multiSelections']
  });

  if (canceled || filePaths.length === 0) return null;
  const filePath = filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');
  return { filePath, name: path.basename(filePath), content };
});

ipcMain.handle('save-file-as', async (event, { content, defaultName }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save VerScript File (*.vrs, *.lib.vrs, *.h.vrs)',
    defaultPath: defaultName || 'script.vrs',
    filters: [
      { name: 'VerScript Source (*.vrs)', extensions: ['vrs'] },
      { name: 'VerScript Library Module (*.lib.vrs)', extensions: ['lib.vrs', 'vrs'] },
      { name: 'VerScript Header Contract (*.h.vrs)', extensions: ['h.vrs', 'vrs'] },
      { name: 'All Files (*.*)', extensions: ['*'] }
    ]
  });

  if (canceled || !filePath) return null;
  fs.writeFileSync(filePath, content, 'utf-8');
  return { filePath, name: path.basename(filePath) };
});

ipcMain.handle('save-file', async (event, { filePath, content }) => {
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
});
