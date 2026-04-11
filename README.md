# Conversion

This repository currently contains the Django backend for the file conversion app.

## Backend setup

1. Create and activate a virtual environment.
2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Apply migrations:

```powershell
python .\Dalbadlu\manage.py migrate
```

4. Start the backend:

```powershell
python .\Dalbadlu\manage.py runserver
```

The API routes are exposed from `dalbadluApp1`:

- `GET/POST /api/conversions/`
- `GET /api/conversions/<id>/`

## Frontend setup

The frontend lives in `frontend/` and uses React, Vite, and Tailwind CSS.

1. Install frontend dependencies:

```powershell
cd .\frontend
npm install
```

2. Start the frontend dev server:

```powershell
npm run dev
```

3. Keep the Django backend running on `http://127.0.0.1:8000`.

Vite proxies `/api` and `/media` requests to Django, so the frontend can call
the backend without changing backend code.

## Notes

- There is no separate frontend app checked into this repository yet.
- `docx2pdf` requires Microsoft Word to be installed on Windows for Word-to-PDF conversion to work.
