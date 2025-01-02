# Live Video Call Backend with 100ms Integration

This project is a backend service for managing live video calls using the [100ms API](https://www.100ms.live). It supports creating rooms, generating tokens for participants, listing active rooms, and tracking participant activity in real-time using WebSockets.

## Features

- **Room Management:** Create and list rooms for video calls.
- **Token Generation:** Generate participant tokens for secure room access.
- **Real-Time Updates:** Track participants joining and leaving rooms using WebSockets.
- **Database Integration:** Store room and participant details in MongoDB.

## Prerequisites

Before running this project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/)
- 100ms account to obtain API keys

## Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your `.env` file with the following variables:
   ```env
   PORT=3000
   API_KEY=<your-100ms-access-key>
   APP_SECRET=<your-100ms-app-secret>
   MONGO_URI=<your-mongodb-connection-string>
   ```

## Usage

### Start the Server

To run the server:
```bash
npm start
```
The server will start on the specified port (default: 3000).

### API Endpoints

#### 1. Create a Room
- **Endpoint:** `POST /rooms`
- **Body:**
  ```json
  {
    "roomName": "My Room"
  }
  ```
- **Response:**
  ```json
  {
    "id": "roomId",
    "name": "My Room",
    "created_at": "2025-01-01T00:00:00Z",
    "...otherFields": "..."
  }
  ```

#### 2. Generate Token
- **Endpoint:** `POST /rooms/:roomId/token`
- **Body:**
  ```json
  {
    "role": "host"
  }
  ```
- **Response:**
  ```json
  {
    "token": "<jwt-token>"
  }
  ```

#### 3. List Rooms
- **Endpoint:** `GET /rooms`
- **Response:**
  ```json
  {
    "rooms": [
      {
        "roomId": "roomId",
        "name": "My Room",
        "participantCount": 10,
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ]
  }
  ```

### WebSocket Integration

- **Connection URL:** `ws://localhost:3000`
- **Supported Events:**

  1. **Join Room**
     - **Message:**
       ```json
       {
         "event": "join",
         "data": {
           "roomId": "roomId",
           "userId": "userId"
         }
       }
       ```

  2. **Leave Room**
     - **Message:**
       ```json
       {
         "event": "leave",
         "data": {
           "roomId": "roomId",
           "userId": "userId"
         }
       }
       ```

  3. **Server Updates**
     - **Message:**
       ```json
       {
         "event": "update",
         "data": {
           "roomId": "roomId",
           "userId": "userId",
           "action": "joined"
         }
       }
       ```

## Database Schema

### Room Schema
```javascript
const RoomSchema = new mongoose.Schema({
  roomId: String,
  name: String,
  createdAt: Date,
  participantCount: { type: Number, default: 0 },
});
```

### Participant Schema
```javascript
const ParticipantSchema = new mongoose.Schema({
  userId: String,
  roomId: String,
  token: String,
  joinedAt: Date,
  leftAt: Date,
});
```

## Technologies Used

- **Node.js**: Backend runtime
- **Express**: Web framework
- **MongoDB**: Database
- **100ms API**: Video call management
- **WebSocket**: Real-time communication

## License
This project is licensed under the MIT License. Feel free to use and modify it as per your needs.

