<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0f2027,203a43,2c5364&height=200&section=header&text=HobbyMet&fontSize=50&fontColor=ffffff&animation=fadeIn" />
</p>

<p align="center">
  <strong>Scalable Full‑Stack Event & Hobby Networking Platform</strong><br/>
  Real‑time communication • Geospatial discovery • Modular backend architecture
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/vivekranjan0144/HobbyMet?style=for-the-badge&color=1f6feb" />
  <img src="https://img.shields.io/github/forks/vivekranjan0144/HobbyMet?style=for-the-badge&color=1f6feb" />
  <img src="https://img.shields.io/github/license/vivekranjan0144/HobbyMet?style=for-the-badge&color=1f6feb" />
  <img src="https://img.shields.io/github/last-commit/vivekranjan0144/HobbyMet?style=for-the-badge&color=1f6feb" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-0d1117?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-Backend-0d1117?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Database-0d1117?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/React-Frontend-0d1117?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Authentication-0d1117?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-0d1117?style=for-the-badge&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/Cloudinary-Storage-0d1117?style=for-the-badge" />
</p>

---

## Overview

HobbyMet is a production‑oriented full‑stack web application that enables users to discover, host, and participate in hobby‑based events. The system is designed with scalability, modularity, and data integrity in mind.

The platform integrates:

- Secure authentication and authorization
- Event lifecycle management
- Controlled join request workflows
- Real‑time event chat using WebSockets
- Location‑based discovery powered by geospatial indexing
- Notification engine
- Structured rating and review system

---

## Live Deployment

See Live: https://hobby-met.vercel.app

---

## Key Functional Modules

| Module | Responsibility |
|--------|---------------|
| Authentication | JWT-based authentication & route protection |
| Event Management | Event creation, visibility control, capacity enforcement |
| Join Workflow | Host-controlled approval & membership synchronization |
| Real-Time Chat | Socket.IO event-based communication rooms |
| Geospatial Discovery | MongoDB 2dsphere indexed nearby search |
| Notifications | Join, message & rating alerts |
| Reviews | Aggregated rating system with integrity constraints |

---

## System Architecture

```
Client (React)
        │
        ▼
Express REST API
        │
        ├── Controllers
        ├── Services
        ├── Middleware
        ├── Data Models (Mongoose)
        │
        ▼
MongoDB (Indexed Collections)
        │
        ▼
Socket.IO (Real-time Layer)
```

The backend follows a layered architecture ensuring separation of concerns and maintainability.

---

## Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose ODM
- JWT Authentication
- Socket.IO
- Cloudinary
- MongoDB 2dsphere Geospatial Indexing

### Frontend
- React.js
- Axios
- React Router
- Context API
- Tailwind CSS

---

## Database & Performance Highlights

- Geospatial 2dsphere indexes for optimized nearby queries
- Compound unique indexes for review integrity
- Dedicated EventMember collection for role tracking
- JoinRequest uniqueness constraints for workflow consistency
- Indexed notifications for efficient pagination
- Optimized query filtering & pagination strategies

---

## Project Structure

```
HobbyMet/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── services/
│   ├── middleware/
│   ├── config/
│   └── sockets/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── context/
│   └── services/
│
└── README.md
```

---

## Installation

### Backend

```
cd backend
npm install
npm run dev
```

Server runs at: http://localhost:4000

### Frontend

```
cd frontend
npm install
npm start
```

Application runs at: http://localhost:3000

---

## Environment Configuration

Create a `.env` file inside `/backend`:

```
PORT=4000
NODE_ENV=development

MONGODB_URI=your_mongodb_uri
DB_NAME=hobbymeet

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

CORS_ORIGIN=*
```

---

## API Example

Example: Create Event

```
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Photography Meetup",
  "description": "Weekend outdoor photography session",
  "category": "photography",
  "hobbyTags": ["camera", "nature"],
  "eventDateTime": "2026-03-10T10:00:00Z",
  "location": {
    "type": "Point",
    "coordinates": [85.8245, 20.2961]
  }
}
```

---

## Engineering Considerations

- Strict separation of concerns (Controller → Service → Model)
- WebSocket room isolation per event
- Data integrity via compound unique indexing
- Defensive validation & structured error handling
- Automated event lifecycle updates
- Scalable join request workflow

---

## Roadmap

- Administrative dashboard
- Event analytics module
- Push notification integration
- Docker containerization
- CI/CD pipeline integration

---

## Author

Vivek Ranjan  
GitHub: https://github.com/vivekranjan0144

---

## License

This project is intended for educational and portfolio purposes.

