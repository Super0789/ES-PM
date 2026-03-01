# Emirates Stone PM System

A production-ready web application for managing construction projects at Emirates Stone (Sharjah, UAE). Replaces and improves the existing Python/Tkinter desktop application.

## Features

- **Project Management** – Full CRUD for projects with all original fields (Project_number, Client, Contract, Variations, Payments, etc.)
- **Payment Tracking** – Track payment submissions and certification workflow (auto-assigns to Payment_1..14 slots)
- **Handing Over Tracking** – Initial and Final HO status management with inline editing
- **Approved BOQ** – Bill of Quantities management per project
- **Attachments** – PDF upload/download for any project field
- **Filters & Search** – All desktop app filters replicated (client, PM, year, remaining %, HO pending, payment pending, discrepancy, completed toggle)
- **Dashboard** – Summary cards, charts (projects by year/PM, payment status)
- **Overdue Projects** – Highlighted list of projects past their deadline
- **Export** – CSV export of project data
- **Role-Based Access Control** – Admin, Editor, Viewer, Guest roles
- **Audit Trail** – Logs who changed what and when
- **Responsive Design** – Works on desktop and mobile

## Tech Stack

- **Backend:** Django 4.2 + Django REST Framework + PostgreSQL
- **Frontend:** React 18 (Vite) + Tailwind CSS + Recharts
- **Auth:** JWT (djangorestframework-simplejwt)
- **Deployment:** Docker Compose (web, db, nginx, frontend)

## Quick Start

### Prerequisites
- Docker and Docker Compose installed

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Super0789/ES-PM.git
   cd ES-PM
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and set a secure SECRET_KEY and POSTGRES_PASSWORD
   ```

3. **Build and start services:**
   ```bash
   docker-compose up -d --build
   ```

4. **Create an admin user:**
   ```bash
   docker-compose exec web python manage.py createsuperuser
   # Then set the user's role to 'admin' via Django shell:
   docker-compose exec web python manage.py shell -c "
   from accounts.models import User
   u = User.objects.get(username='your-username')
   u.role = 'admin'
   u.save()
   "
   ```

5. **Access the application:**
   - Frontend: http://localhost
   - Django Admin: http://localhost/admin/
   - API: http://localhost/api/

### Importing Existing Data (SQLite Migration)

If you have an existing `project_management.db` SQLite database:

```bash
# Copy the database file to the container
docker cp /path/to/project_management.db $(docker-compose ps -q web):/app/

# Run the import command
docker-compose exec web python manage.py import_sqlite --sqlite-path /app/project_management.db

# Optionally copy existing attachment files
docker cp /path/to/attachments/ $(docker-compose ps -q web):/app/media/
```

### Development (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs on http://localhost:5173 and proxies API calls to the Django backend at http://localhost:8000.

## Project Structure

```
ES-PM/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── config/          # Django settings, URLs, WSGI
│   ├── accounts/        # User auth, roles, audit log
│   ├── projects/        # Main project app
│   ├── payments/        # Payment tracking
│   ├── attachments/     # File attachment management
│   ├── boq/             # Approved BOQ items
│   └── management/
│       └── commands/
│           └── import_sqlite.py  # Data migration from old SQLite DB
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── pages/       # Dashboard, ProjectList, ProjectDetail, etc.
│       ├── components/  # Shared UI components
│       ├── api/         # API client functions
│       ├── context/     # Auth context
│       ├── hooks/       # Custom React hooks
│       └── utils/       # Formatters, constants
└── nginx/
    └── nginx.conf       # Reverse proxy configuration
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login/ | Get JWT tokens |
| POST | /api/auth/refresh/ | Refresh access token |
| GET | /api/projects/ | List projects (with filters) |
| POST | /api/projects/ | Create project |
| GET | /api/projects/{pk}/ | Project detail |
| PUT/PATCH | /api/projects/{pk}/ | Update project |
| DELETE | /api/projects/{pk}/ | Delete project |
| GET | /api/projects/export/ | Export CSV |
| GET | /api/projects/stats/ | Dashboard stats |
| GET | /api/projects/overdue/ | Overdue projects |
| GET | /api/projects/handing-over/ | HO tracking |
| GET | /api/payments/ | List payments |
| POST | /api/payments/{pk}/certify/ | Certify payment |
| GET | /api/attachments/ | List attachments |
| POST | /api/attachments/ | Upload attachment |
| GET | /api/attachments/{pk}/download/ | Download file |
| GET/POST | /api/boq/ | BOQ items |
| GET | /api/users/ | User management (admin) |

## Role-Based Access Control

| Role | Permissions |
|------|-------------|
| Admin | Full access: CRUD all data, manage users, view audit log |
| Editor | Create/edit projects, payments, BOQ, upload/remove attachments |
| Viewer | View all data and download attachments |
| Guest (unauthenticated) | View project list and basic details only |

## Project Number Format

Projects use the format `YYYY-XX` (e.g., `2024-15`). The year prefix is used for year-based filtering and sorting.

## Currency & Date Formatting

- Currency: AED (UAE Dirham), displayed with comma-separated thousands
- Dates: Displayed as DD/MM/YYYY, stored as YYYY-MM-DD

