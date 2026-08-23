# 🤫 Whisper — Anonymous Secrets App

An anonymous secrets web application built with Node.js, Express REST API, EJS, and Vanilla JavaScript with a warm, human editorial design.

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js (REST API), Axios
- **Frontend**: EJS, CSS3 (Editorial design system), Vanilla JavaScript
- **Data**: In-memory JavaScript data store (structured for PostgreSQL migration)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start server
npm start
```

Visit the app at `http://localhost:3000`.

## 📡 REST API Endpoints

| Method | Endpoint | Description | Response Status |
|---|---|---|---|
| `GET` | `/api/secrets` | Fetch all secrets | `200 OK` |
| `GET` | `/api/secrets/random` | Fetch a random secret | `200 OK` |
| `GET` | `/api/secrets/:id` | Fetch secret by ID | `200 OK` / `404` |
| `POST` | `/api/secrets` | Create anonymous secret (`{ "text": "..." }`) | `201 Created` / `400` |
| `DELETE` | `/api/secrets/:id` | Delete secret by ID | `200 OK` / `404` |

## 📂 Project Structure

```text
secrets-app/
├── data/           # In-memory secrets data store
├── services/       # Business logic layer (PostgreSQL ready)
├── controllers/    # Express route controllers & validation
├── routes/         # REST API router (/api/secrets)
├── middleware/     # Centralized error handler
├── views/          # EJS templates (index.ejs, error.ejs)
├── public/         # CSS styles & client JavaScript (app.js)
├── server.js       # Express server entry point
└── package.json
```

## 🧪 Example API Request

```bash
# Create a secret
curl -X POST http://localhost:3000/api/secrets \
  -H "Content-Type: application/json" \
  -d '{"text": "I practice public speaking in front of my cat."}'
```
