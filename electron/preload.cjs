const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBinaryInfo: (customPath) => ipcRenderer.invoke('get-binary-info', customPath),
  installVerScript: () => ipcRenderer.invoke('install-verscript'),
  checkOnline: () => ipcRenderer.invoke('check-online'),
  queryVSSharp: (payload) => ipcRenderer.invoke('query-vs-sharp', payload),
  runCode: (payload) => ipcRenderer.invoke('run-code', payload),
  killRun: () => ipcRenderer.invoke('kill-run'),
  sendStdinInput: (input) => ipcRenderer.invoke('send-stdin-input', input),
  startRepl: (customPath) => ipcRenderer.invoke('start-repl', customPath),
  sendReplInput: (input) => ipcRenderer.invoke('send-repl-input', input),
  killRepl: () => ipcRenderer.invoke('kill-repl'),
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFileAs: (payload) => ipcRenderer.invoke('save-file-as', payload),
  saveFile: (payload) => ipcRenderer.invoke('save-file', payload),
  
  onRunOutput: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('run-output', handler);
    return () => ipcRenderer.removeListener('run-output', handler);
  },
  onReplData: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('repl-data', handler);
    return () => ipcRenderer.removeListener('repl-data', handler);
  },
  onInstallLog: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('install-log', handler);
    return () => ipcRenderer.removeListener('install-log', handler);
  }
});
