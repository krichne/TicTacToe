# Tic-Tac-Toe WebSocket Multiplayer

A lightweight multiplayer Tic-Tac-Toe game built with Node.js, Express, WebSockets, and Vue.js.

![Tic-Tac-Toe Game](https://raw.githubusercontent.com/username/tictactoe-ws/main/screenshot.png)

## Features

- Real-time multiplayer gameplay with WebSockets
- Simple and intuitive user interface
- Lobby system with online player list
- Challenge and response mechanism
- Game state synchronization
- Responsive design for all devices

## Tech Stack

- **Frontend**: Vue.js 3 with inline templates
- **Backend**: Node.js, Express
- **Real-time Communication**: WebSockets (ws library)
- **Styling**: Clean, minimalist CSS

## Installation

### Prerequisites

- Node.js (v12.x or later)
- npm (v6.x or later)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/username/tictactoe-ws.git
   cd tictactoe-ws
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   node server.js
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## How to Play

1. **Enter a Nickname**: Start by entering a unique nickname to join the game lobby.

2. **Challenge a Player**: In the lobby, you'll see a list of online players. Click the "Challenge" button next to a player's name to invite them to a game.

3. **Accept/Decline Challenges**: If someone challenges you, you'll receive a notification with options to accept or decline the challenge.

4. **Game Rules**: 
   - Players take turns placing their symbol (X or O) on the 3x3 grid.
   - The first player is assigned 'X' and goes first.
   - The second player is assigned 'O'.
   - The first player to get three of their symbols in a row (horizontally, vertically, or diagonally) wins.
   - If all cells are filled without anyone getting three in a row, the game ends in a draw.

5. **Making Moves**: Click on an empty cell to place your symbol when it's your turn.

6. **End of Game**: After a game ends, you can choose to play again with the same opponent or return to the lobby.

## Project Structure

- `index.html` - Minimal HTML file for the app container
- `style.css` - CSS styles for the game interface
- `main.js` - Vue.js frontend application with inline templates
- `server.js` - Node.js backend server with WebSocket implementation

## Code Organization

### Frontend (main.js)

The frontend uses Vue.js with a component structure:
- Game stages: nickname entry → lobby → challenge → game
- WebSocket communication with the backend
- Game state management
- Simple, component-based UI

### Backend (server.js)

The server handles:
- Static file serving
- WebSocket connections
- Player management (nicknames and availability)
- Room creation for matches
- Game state synchronization
- Win condition checking
