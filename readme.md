<div align="center">
  <img src="public/blaze-md-logo.svg" alt="BLAZE-MD logo" width="760" />

  <h1>BLAZE-MD</h1>
  <p><strong>A fast, modern WhatsApp automation bot built for practical everyday use.</strong></p>

  <p>
    <a href="https://github.com/blazetech-glitch/BLAZE-TECH/stargazers"><img src="https://img.shields.io/github/stars/blazetech-glitch/BLAZE-TECH?style=for-the-badge&logo=github&label=Stars&color=f59e0b" alt="GitHub stars" /></a>
    <a href="https://github.com/blazetech-glitch/BLAZE-TECH/network/members"><img src="https://img.shields.io/github/forks/blazetech-glitch/BLAZE-TECH?style=for-the-badge&logo=github&label=Forks&color=14b8a6" alt="GitHub forks" /></a>
    <a href="https://github.com/blazetech-glitch/BLAZE-TECH/blob/main/LICENSE"><img src="https://img.shields.io/github/license/blazetech-glitch/BLAZE-TECH?style=for-the-badge&label=License&color=3b82f6" alt="License" /></a>
  </p>

  <p>
    <a href="https://github.com/blazetech-glitch/BLAZE-TECH/fork"><img src="https://img.shields.io/badge/Fork%20the%20project-111827?style=for-the-badge&logo=github&logoColor=white" alt="Fork the project" /></a>
    <a href="https://blaze-pair-site.onrender.com/"><img src="https://img.shields.io/badge/Get%20session%20ID-0f766e?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Get session ID" /></a>
    <a href="https://github.com/blazetech-glitch/BLAZE-TECH/archive/refs/heads/main.zip"><img src="https://img.shields.io/badge/Download%20ZIP-c2410c?style=for-the-badge&logo=github&logoColor=white" alt="Download ZIP" /></a>
  </p>
</div>

## About BLAZE-MD

BLAZE-MD is a modular WhatsApp automation project with command plugins, group utilities, media tools, search features, and configurable bot behavior. The project is organized so new commands can be added without disturbing the existing command registry.

> **Project identity:** BLAZE-MD is the bot name. The source repository is **BLAZE-TECH**.

## Quick start

### 1. Fork and clone

```bash
git clone https://github.com/blazetech-glitch/BLAZE-TECH.git
cd BLAZE-TECH
npm install
```

### 2. Configure the bot

Review the project configuration files and set the required environment values for your deployment. Keep authentication credentials and private tokens out of Git commits.

### 3. Generate a session

Use the [BLAZE-MD pairing service](https://blaze-pair-site.onrender.com/) to obtain the session information required by your deployment method.

### 4. Start the bot

```bash
npm start
```

## Deploy

<div align="center">

| Option | Link |
|:--|:--:|
| **Deploy to Heroku** | [![Deploy to Heroku](https://img.shields.io/badge/Deploy%20to%20Heroku-7c3aed?style=for-the-badge&logo=heroku&logoColor=white)](https://dashboard.heroku.com/new?template=https://github.com/blazetech-glitch/BLAZE-TECH) |
| **Download source ZIP** | [![Download source](https://img.shields.io/badge/Download%20source-0f766e?style=for-the-badge&logo=github&logoColor=white)](https://github.com/blazetech-glitch/BLAZE-TECH/archive/refs/heads/main.zip) |
| **Open the repository** | [![Open GitHub](https://img.shields.io/badge/Open%20on%20GitHub-111827?style=for-the-badge&logo=github&logoColor=white)](https://github.com/blazetech-glitch/BLAZE-TECH) |

</div>

## Project structure

| Directory | Purpose |
|:--|:--|
| `devblaze/` | Core command registry and shared bot utilities |
| `plugins/` | Feature commands grouped by function |
| `handlers/` | Command and event handling |
| `lib/` | Internal helpers and runtime support |
| `asset/` | Project data and supporting assets |
| `public/` | Public documentation and static resources |

## Contributing

Contributions are welcome. Fork the repository, create a focused branch, test your changes locally, and open a pull request with a clear explanation of the improvement.

```bash
git checkout -b feature/your-improvement
# make and test your changes
git add .
git commit -m "Describe your improvement"
git push origin feature/your-improvement
```

## Support and links

- **Repository:** [github.com/blazetech-glitch/BLAZE-TECH](https://github.com/blazetech-glitch/BLAZE-TECH)
- **Pairing service:** [blaze-pair-site.onrender.com](https://blaze-pair-site.onrender.com/)
- **Channel:** [Join the BLAZE-MD channel](https://whatsapp.com/channel/0029VbAjwl9MF8vQQa0ZT32)
- **Community group:** [Join the BLAZE-MD group](https://chat.whatsapp.com/HxCDA2s89LMEZMyixnTSy5?s=cl&p=a&ilr=4)

<div align="center">
  <sub>Built with care for the BLAZE-MD community.</sub>
</div>
