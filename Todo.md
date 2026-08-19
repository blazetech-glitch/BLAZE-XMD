<div align="center">
<img src="public/blaze-xmd-logo.svg" width="760" alt="Animated BLAZE-XMD logo" />
    

  <img src="public/blaze-tech-logo.svg" width="680" alt="Animated BLAZE-TECH logo" />   <h1>
    <span style="color:#ff8a3d; font-family:Georgia,serif; letter-spacing:3px;">BLAZE</span><span style="color:#2dd4bf; font-family:Georgia,serif; letter-spacing:3px;">-XMD</span>
  </h1>   <p><strong>𝘽𝙇𝘼𝙕𝙀 𝙓𝙈𝘿</strong> <em>WhatsApp automation for modern communities</em></p>   <p>
    <a href="https://github.com/blazetech-glitch/BLAZE-XMD/fork">
      <img src="https://img.shields.io/github/forks/blazetech-glitch/BLAZE-XMD?style=for-the-badge&logo=github&label=FORKS&color=ff8a3d" alt="GitHub forks" />
    </a>
    <a href="https://github.com/blazetech-glitch/BLAZE-XMD">
      <img src="https://img.shields.io/github/stars/blazetech-glitch/BLAZE-XMD?style=for-the-badge&logo=github&label=STARS&color=2dd4bf" alt="GitHub stars" />
    </a>
    <a href="https://github.com/blazetech-glitch/BLAZE-XMD/issues">
      <img src="https://img.shields.io/github/issues/blazetech-glitch/BLAZE-XMD?style=for-the-badge&logo=github&label=ISSUES&color=8b5cf6" alt="GitHub issues" />
    </a>
    <img src="https://img.shields.io/badge/WHATSAPP-AUTOMATION-07111f?style=for-the-badge&logo=whatsapp&logoColor=white&labelColor=25D366" alt="WhatsApp automation" />
  </p>   <p>
    <a href="https://github.com/blazetech-glitch/BLAZE-XMD/fork">Fork Repository</a> •
    <a href="https://blaze-tech-pair-site.onrender.com/">Get Session ID</a> •
    <a href="https://dashboard.heroku.com/new?template=https://github.com/blazetech-glitch/BLAZE-XMD">Deploy to Heroku</a> •
    <a href="#commands">Explore Commands</a>
  </p>
</div> <p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&pause=900&color=FF8A3D&center=true&vCenter=true&width=760&lines=Fast+%7C+Modern+%7C+Reliable;Modular+WhatsApp+automation;Built+for+communities%2C+groups%2C+and+creators;Add+commands+without+breaking+the+registry" alt="BLAZE-XMD animated description" />
</p> <p align="center">
  <img src="https://media.giphy.com/media/qgQUggAC3Pfv687qPC/giphy.gif" width="420" alt="Animated developer coding GIF" />
</p>

> **BLAZE-XMD** is a modular WhatsApp automation project with command plugins, group utilities, media tools, search features, and configurable bot behavior. New commands can be added without disturbing the existing command registry.

> **Project identity:** BLAZE-XMD is both the bot name and the source repository name.

---

## Navigation

- [Features](#features)

- [Quick Start](#quick-start)

- [Pair the Bot](#pair-the-bot)

- [Configuration](#configuration)

- [Commands](#commands)

- [Deployment](#deployment)

- [Tips and Warnings](#tips-and-warnings)

- [Troubleshooting](#troubleshooting)

- [Roadmap](#roadmap)

- [Contributing](#contributing)

---

## Features

<table>
<tr>
    <td width="33%" valign="top">
      <h3>Group Utilities</h3>
      <p>Moderation helpers, group management, tagging tools, welcome messages, and community controls.</p>
    </td>
    <td width="33%" valign="top">
      <h3>Media Tools</h3>
      <p>Sticker creation, image conversion, media processing, and download utilities.</p>
    </td>
    <td width="33%" valign="top">
      <h3>Search Tools</h3>
      <p>Search commands, media discovery, link tools, and configurable lookup features.</p>
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top">
      <h3>Plugin System</h3>
      <p>Add new commands as independent plugins while keeping the core command registry organized.</p>
    </td>
    <td width="33%" valign="top">
      <h3>Owner Controls</h3>
      <p>Owner-only commands for administration, configuration, restart operations, and broadcast tasks.</p>
    </td>
    <td width="33%" valign="top">
      <h3>Flexible Behavior</h3>
      <p>Configure the prefix, bot name, owner identity, responses, and group behavior through environment settings.</p>
    </td>
  </tr>
</table> <details>
<summary><strong>Tap to read more about the project architecture</strong></summary>

BLAZE-XMD is designed around small command modules. A command receives a message, checks the relevant permissions, performs its task, and returns a response. This approach makes it easier to maintain existing commands and add new functionality in separate files.

A typical extension flow is:

```
Incoming WhatsApp message
          ↓
Message and permission checks
          ↓
Command/plugin registry
          ↓
Selected command handler
          ↓
Response, media, or group action
```

</details>

---

## Quick Start

### Prerequisites

- [x] A GitHub account for forking the repository

- [x] Node.js and npm installed on the deployment environment

- [x] A WhatsApp account for pairing the bot

- [x] A secure session ID

- [x] Environment variables configured before starting the bot

### Install locally

```bash
git clone https://github.com/blazetech-glitch/BLAZE-XMD.git
cd BLAZE-XMD
npm install
cp .env.example .env
npm start
```

<details>
<summary><strong>Tap to see the complete setup checklist</strong></summary>

```
[ ] Fork the repository
[ ] Clone your fork or use the original repository
[ ] Install project dependencies
[ ] Create the environment file
[ ] Generate or obtain a session ID
[ ] Add the session ID to the environment file
[ ] Confirm owner and prefix settings
[ ] Start the bot
[ ] Test the .menu or help command
```

</details>

---

## Pair the Bot

Use the following workflow to connect BLAZE-XMD to WhatsApp.

### 1. Fork the repository

<p align="center">
<a href="https://github.com/blazetech-glitch/BLAZE-XMD/fork" target="_blank">
    <img src="https://img.shields.io/badge/FORK%20REPOSITORY-100000?style=for-the-badge&logo=github&logoColor=white&labelColor=darkblue&color=darkblue" alt="Fork BLAZE-XMD repository" />
  </a>
</p>

### 2. Generate a session ID

<p align="center">
<a href="https://blaze-tech-pair-site.onrender.com/" target="_blank">
    <img src="https://img.shields.io/badge/GET%20SESSION%20ID-100000?style=for-the-badge&logo=whatsapp&logoColor=white&labelColor=darkred&color=darkred" alt="Get BLAZE-XMD session ID" />
  </a>
</p>

### 3. Add the session ID

Open your deployment environment and add the session ID to the variable expected by the project. Never paste it into a public issue, chat, screenshot, or source file.

### 4. Deploy the bot

Choose one of the supported deployment options below and follow the platform-specific instructions.

---

## Configuration

Create a `.env` file from the example file supplied by the project.

```bash
cp .env.example .env
```

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `SESSION_ID` | Yes | `your-private-session-id` | Authenticates the WhatsApp session |
| `OWNER_NUMBER` | Yes | `1234567890` | Identifies the bot owner |
| `PREFIX` | No | `.` | Sets the command prefix |
| `BOT_NAME` | No | `BLAZE-XMD` | Sets the displayed bot name |
| `MODE` | No | `public` | Controls the operating mode, if supported |

> **Important:** Confirm the exact variable names in `.env.example` before deploying. The table above is a documentation template and should match the project source.

<details>
<summary><strong>Tap to read the credential safety rules</strong></summary>

- Never commit `.env` to GitHub.

- Never share your session ID publicly.

- Never place API keys inside README code blocks.

- If credentials are exposed, revoke or regenerate them immediately.

- Use private deployment variables instead of hard-coding secrets in JavaScript files.

</details>

---

## Commands

Replace the example entries below with the actual commands available in the plugin directory.

| Command | Category | Permission | Example | Status |
| --- | --- | --- | --- | --- |
| `.menu` | General | Everyone | `.menu` | [x] |
| `.help` | General | Everyone | `.help` | [x] |
| `.sticker` | Media | Everyone | Reply to an image with `.sticker` | [x] |
| `.tagall` | Groups | Admin | `.tagall` | [x] |
| `.restart` | Owner | Owner | `.restart` | [x] |
| `.newcommand` | Custom | Configurable | `.newcommand` | [ ] |

<details>
<summary><strong>Tap to read command permission levels</strong></summary>

| Permission | Meaning |
| --- | --- |
| Everyone | Any user can run the command. |
| Admin | The sender must be a group administrator. |
| Owner | Only the configured bot owner can run the command. |
| Private | The command is restricted to private chats or approved users. |

</details>

---

## Deployment

### Heroku

<p align="center">
<a href="https://dashboard.heroku.com/new?template=https://github.com/blazetech-glitch/BLAZE-XMD" target="_blank">
    <img src="https://img.shields.io/badge/DEPLOY%20TO%20HEROKU-100000?style=for-the-badge&logo=heroku&logoColor=white&labelColor=purple&color=purple" alt="Deploy BLAZE-XMD to Heroku" />
  </a>
</p>

### Download the source ZIP

<p align="center">
<a href="https://github.com/blazetech-glitch/BLAZE-XMD/archive/refs/heads/main.zip" target="_blank">
    <img src="https://img.shields.io/badge/DOWNLOAD%20BOT%20ZIP-100000?style=for-the-badge&logo=github&logoColor=white&labelColor=darkorange&color=darkorange" alt="Download BLAZE-XMD ZIP" />
  </a>
</p>

| Option | Best for | Action |
| --- | --- | --- |
| Heroku | Fast cloud deployment | Use the deployment button above |
| Local machine | Development and testing | Clone the repository and run `npm start` |
| Other host | Custom infrastructure | Install dependencies and configure environment variables manually |

> **Tip:** Test the bot locally before deploying it to a cloud platform. This makes configuration errors easier to identify.

---

## Tips and Warnings

> [!TIP]Start with the default prefix and test `.menu` before changing advanced settings. This confirms that the session and command registry are working.

> [!IMPORTANT]Keep your session ID, owner number, API keys, and deployment secrets inside private environment variables.

> [!WARNING]Do not run unknown plugins without inspecting their source. Plugins may receive messages, access credentials, or perform external requests depending on the project configuration.

> [!CAUTION]Avoid mass messaging, spam, or behavior that violates WhatsApp policies or harms other users. Use the bot responsibly and only in communities where it is authorized.

<details>
<summary><strong>Tap to read troubleshooting tips</strong></summary>

### The bot does not start

Check that dependencies are installed, the environment file exists, and the start command matches the project scripts.

### The session is rejected

Generate a new session ID, verify that it was copied completely, and confirm that it was added to the correct deployment variable.

### Commands do not respond

Check the prefix, confirm that the command plugin is loaded, and review the deployment logs for startup errors.

### Group commands fail

Confirm that the bot is in the group and that the sender has the required administrator or owner permission.

</details>

---

## Screenshots and Demo

Add your own screenshots or a short demonstration GIF here after recording the bot in a test group.

```
<p align="center">
  <img src="public/demo.gif" width="760" alt="BLAZE-XMD command demonstration" />
</p>
```

> **Recommended:** Store project-owned media inside `public/` or `assets/` and reference it with a relative path. This prevents an external image host from unexpectedly changing or removing your project visuals.

---

## Project Statistics

<p align="center">
<img src="https://github-readme-stats.vercel.app/api?username=blazetech-glitch&repo=BLAZE-XMD&show_icons=true&theme=tokyonight&hide_border=true&title_color=ff8a3d&icon_color=2dd4bf" height="165" alt="BLAZE-XMD GitHub statistics" />
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=blazetech-glitch&layout=compact&theme=tokyonight&hide_border=true&title_color=ff8a3d" height="165" alt="Most used languages by the repository owner" />
</p>

---

## Roadmap

- [x] Modular command registry

- [x] WhatsApp session pairing flow

- [x] Group utility foundation

- [x] Media command foundation

- [ ] Expand the public command catalog

- [ ] Add automated tests for core plugins

- [ ] Add a dedicated troubleshooting guide

- [ ] Add deployment guides for more platforms

- [ ] Add a polished demo GIF and screenshots

---

## Contributing

Contributions are welcome. Before opening a pull request, test your change, describe what it does, and avoid including credentials or private session data.

```bash
git checkout -b feature/your-change
git add .
git commit -m "feat: describe your change"
git push origin feature/your-change
```

Then open a pull request and include:

- [x] A short explanation of the change

- [ ] Testing steps

- [ ] Screenshots or logs where useful

- [ ] No secrets, session IDs, or private data

- [ ] Documentation updates when behavior changes

---

## Support

For bugs or feature requests, open an issue in the [BLAZE-XMD repository](https://github.com/blazetech-glitch/BLAZE-XMD/issues). Please include the error message, deployment platform, relevant logs, and the steps that reproduce the problem. Do not include credentials.

<p align="center">
<a href="https://github.com/blazetech-glitch/BLAZE-XMD/issues">Report an Issue</a> •
  <a href="https://github.com/blazetech-glitch/BLAZE-XMD/fork">Fork the Project</a> •
  <a href="https://github.com/blazetech-glitch">Visit BLAZE-TECH</a>
</p>

---

<div align="center">
<strong>Built with focus by ARNOLDT20 and the BLAZE-TECH community.</strong>
    

  <sub>BLAZE-XMD • Fast • Modern • Reliable</sub>
</div> <!-- External visual assets used above:
     - Typing animation: https://readme-typing-svg.demolab.com/
     - Coding GIF: https://media.giphy.com/media/qgQUggAC3Pfv687qPC/giphy.gif
     - GitHub statistics: https://github-readme-stats.vercel.app/
-->

