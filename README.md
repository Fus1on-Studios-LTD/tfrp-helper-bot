# 🚀 TFRP Helper Discord Bot

A production-ready, modular Discord bot built with **discord.js**, **Prisma**, and **MySQL**, designed for multi-server management, moderation, and support workflows.

---

## ✨ Features

### 🛠 Moderation

* `/purge` — bulk delete messages
* `/globalban` — ban a user across all connected servers
* Audit logging stored in MySQL

### 🌐 Multi-Server Systems

* Centralized database (MySQL)
* Cross-server moderation actions
* Scalable architecture for global role syncing (coming next)

### 📌 Sticky Messages

* Per-channel sticky messages
* Auto-repost with cooldown
* Commands:

  * `/sticky set`
  * `/sticky view`
  * `/sticky remove`

### 🎟 Ticket System

* Button-based ticket creation
* Private support channels
* Auto-close + cleanup
* Commands:

  * `/ticketpanel`

### 🧠 Database & Backend

* Prisma ORM (MySQL)
* Structured models for:

  * users
  * staff
  * tickets
  * moderation
  * audit logs

---

## 🏗 Project Structure

```bash
src/
├── commands/
├── events/
├── handlers/
├── services/
├── lib/
prisma/
```

* **commands/** → slash commands
* **events/** → Discord event listeners
* **handlers/** → loaders
* **services/** → business logic (tickets, moderation, etc.)
* **lib/** → core utilities (client, prisma, env)
* **prisma/** → database schema

---

## ⚙️ Installation

### 1. Clone / Extract

```bash
cd tfrp-helper-bot
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Setup environment

Copy:

```bash
.env.example → .env
```

Fill in:

```env
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_TEST_GUILD_ID=

DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

DATABASE_URL="mysql://user:password@host:3306/db"
```

---

### 4. Generate Prisma Client

```bash
npx prisma generate
```

---

### 5. Push schema to database

⚠️ Use this (not migrate):

```bash
npx prisma db push
```

---

### 6. Test database connection

```bash
node test.js
```

---

### 7. Deploy slash commands

```bash
node src/deploy-commands.js
```

---

### 8. Start the bot

```bash
npm run start
```

---

## 🔐 Required Bot Permissions

* Manage Messages (for `/purge`)
* Ban Members (for `/globalban`)
* Manage Channels (for tickets & sticky messages)
* Read Message History
* Send Messages

---

## 🧩 Core Commands

| Command          | Description                 |
| ---------------- | --------------------------- |
| `/ping`          | Check bot latency           |
| `/purge`         | Delete messages             |
| `/globalban`     | Ban user across all servers |
| `/sticky set`    | Set sticky message          |
| `/sticky remove` | Remove sticky               |
| `/ticketpanel`   | Create ticket system        |

---

## 🧠 How It Works

### Global Ban

* Stored in MySQL
* Propagated across all guilds
* Logged for auditing

### Sticky System

* Stored per channel
* Reposted automatically on activity
* Cooldown-based to prevent spam

### Tickets

* Created via button
* Private channel per user
* Stored in database
* Auto-cleanup on close

---

## ⚡ Development Workflow

```bash
npm run dev
```

Hot reload with nodemon.

---

## 🚀 Deployment (Production)

Recommended setup:

* Ubuntu 24.04 VPS
* PM2 for process management
* Nginx (for dashboard later)
* MySQL (already configured)

### Run with PM2

```bash
pm2 start src/index.js --name helper-bot
pm2 save
pm2 startup
```

---

## 🧱 Roadmap

* [ ] `/globalrole` system
* [ ] Warning / notes / timeout system
* [ ] Staff ranks & analytics
* [ ] Ticket transcripts
* [ ] Dashboard (Next.js + OAuth)
* [ ] WebSocket live updates

---

## 🏢 Fus1on Studios Integration

Designed for:

* scalable hosting environments
* multi-server networks
* production-grade moderation systems

---

## 🧑‍💻 Author

Built for **TFRP / Fus1on ecosystem**

---

## 📜 License

Private / Internal Use (modify as needed)

---

## 💡 Notes

* Do **NOT** use `prisma migrate dev` on hosted DB
* Always use:

  ```bash
  npx prisma db push
  ```
* Ensure passwords are URL encoded if using `DATABASE_URL`

---

## 🛠 Need Help?

If something breaks:

* check `.env`
* check database connectivity
* check bot permissions
* check console logs

---

**You're now running a production-grade Discord system.**
