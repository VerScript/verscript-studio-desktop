# VerScript Studio Desktop 🚀

Official Standalone Offline Desktop IDE for the **VerScript** Programming Language.

![VerScript Studio](https://raw.githubusercontent.com/VerScript/VerScript.github.io/main/assets/banner.png)

## ✨ Features

- 🔌 **100% Offline Capability**: Runs completely standalone with bundled or locally installed `verscript` compiler and VM runtime.
- 💻 **Integrated Interactive REPL**: Built-in real-time interactive shell session with persistent state, block execution, variable inspection (`vars`), and instant expression evaluation.
- 🎨 **Studio Dual-Deck Architecture**:
  - **Top Deck**: Multi-tab Monaco code editor with full syntax highlighting, bracket colorization, minimap, and symbol outline.
  - **Bottom Dock**: Real-time Interactive REPL (`verscript`), File Run output terminal with stdin prompt input drawer, and installer diagnostic logs.
- 🤖 **VS# AI Copilot**:
  - Real-time online/offline network indicator.
  - Neural assistant for code generation, explanation, and error diagnosis (requires internet connection).
- ⚡ **Auto-Installer & Tooling**:
  - Automatically detects system VerScript installation (`%LOCALAPPDATA%\VerScript\verscript.exe`).
  - Seamless 1-click installer downloading latest release via official `install.ps1` if not installed.
- 🔍 **IntelliSense & Autocomplete**:
  - All 118 language keywords & operators.
  - All 29 standard error types.
  - All 21 standard libraries (`Matrix`, `Vector`, `Math`, `Stats`, `Fs`, `Path`, `Http`, `Json`, etc.).
  - Attribute autocompletion (`?color=`, `?msg=`, `?code=`, `?default=`, etc.).

## 📦 Download & Installation

Download the latest portable executable or release archive from [Releases](https://github.com/VerScript/verscript-studio-desktop/releases/latest).

### Running from Source
```bash
git clone https://github.com/VerScript/verscript-studio-desktop.git
cd verscript-studio-desktop
npm install
npm run app
```

### Building Release Package
```bash
npm run dist
```
Distribution binaries are generated in the `release/` directory.

---
© 2026 VerScript Development Team. Licensed under the MIT License.
