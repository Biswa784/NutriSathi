# NutriSathi

AI Dietary Coach + Gamified Education.

NOTE: Docker artifacts were removed from this repository. Run the services
locally using the instructions below.

## Run locally (no Docker)

Backend (Windows PowerShell):
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend (Windows PowerShell):
```powershell
cd frontend
npm install
npm run dev
```

The backend will be available at http://localhost:8000 and the frontend at
http://localhost:5173 by default. If you need a local Postgres database for
development you can start one separately (for example via Docker Desktop or
using a managed service) and set the `DATABASE_URL` environment variable in
the backend before running.

## Troubleshooting

- If the frontend appears unstyled (plain HTML without CSS):
	- Make sure you're opening the exact Vite URL printed in the terminal (Vite will print the active port — often http://localhost:5173/). If 5173 is in use Vite may pick 5174.
	- Do a hard reload in your browser (Ctrl+Shift+R) to clear cached assets.
	- Confirm the dev server is running and that the CSS file is being served (open DevTools → Network → reload → look for a .css asset).

- If the frontend reports `Could not connect to the backend server`: ensure the backend is running (see Backend section) and reachable at http://localhost:8000/health.

This fork replaces the Tailwind/PostCSS UI with a plain-CSS implementation to avoid build-time PostCSS/Tailwind configuration issues during local development. If you prefer the original Tailwind UI, I can help restore it and fix PostCSS configuration.


