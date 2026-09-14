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

Visit the app at `https://whisper-arush-jain.vercel.app/`.

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

## 🔒 Production Security Checklist

When deploying Whisper to a production environment (like Heroku, Render, Vercel, etc.), ensure the following:

1. **Environment Variables**:
   - `DATABASE_URL`: Must point to your Neon PostgreSQL database.
   - `JWT_SECRET`: Must be a long, unpredictable random string (do NOT use the default).
   - `ADMIN_PASSWORD_HASH` **OR** `ADMIN_PASSWORD`: Configure the admin password. It is safer to use `ADMIN_PASSWORD_HASH` (using a bcrypt hash). The app will refuse to start if neither is provided.
   - `NODE_ENV=production`: This triggers strict cookie configurations (like `Secure: true`).

2. **Reverse Proxies & Rate Limiting**:
   - The app has `app.set('trust proxy', 1)` enabled for proper rate limiting behind load balancers.
   - Stricter rate limits apply to public form submissions (10 max per hour) and anonymous reporting (5 max per 15 minutes) to deter spam.

3. **CSRF Protection**:
   - The admin state-changing routes (hiding/deleting secrets) rely on an API powered by `fetch`.
   - The authentication cookie strictly enforces `SameSite: strict`, effectively mitigating basic cross-site request forgery attacks by refusing to send the JWT session cookie if the request originates from a different origin.
