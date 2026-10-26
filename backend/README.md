# Food Delivery API - Backend

FastAPI backend that handles all database operations for the Food Delivery App.
The frontend communicates with this backend via REST API.

## Architecture

- **Frontend (React)**: Uses Firebase Auth only for authentication. Calls backend API for all data operations.
- **Backend (FastAPI)**: Uses Firebase Admin SDK to interact with Firestore. Only the backend accesses the database.

## Setup

### 1. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Firebase Admin SDK

1. Go to your Firebase Console -> Project Settings -> Service Accounts
2. Click "Generate New Private Key" to download `serviceAccountKey.json`
3. Place it in the `backend/` directory
4. Copy `.env.example` to `.env` and update the path if needed:

```bash
cp .env.example .env
```

### 3. Run the server

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

## API Endpoints

### Donations
- `POST /api/donations/` - Create a donation
- `GET /api/donations/?status=Available` - List donations (optional status filter)
- `GET /api/donations/{id}` - Get a donation
- `PATCH /api/donations/{id}/status` - Update donation status

### Requests
- `POST /api/requests/` - Create a food request
- `GET /api/requests/?status=Pending` - List requests (optional status filter)
- `GET /api/requests/{id}` - Get a request
- `PATCH /api/requests/{id}/status` - Update request status

### Deliveries
- `POST /api/deliveries/` - Assign a volunteer to a delivery
- `GET /api/deliveries/?volunteer_id=xxx` - List deliveries (optional volunteer filter)
- `GET /api/deliveries/{id}` - Get a delivery
- `PATCH /api/deliveries/{id}/status` - Update delivery status

### Users
- `POST /api/users/{user_id}/profile` - Create/update user profile
- `GET /api/users/{user_id}/profile` - Get user profile

## Security

- The frontend never accesses Firestore directly
- All database operations go through the FastAPI backend
- Firebase Admin SDK service account key is backend-only
- CORS is configured to allow frontend communication
