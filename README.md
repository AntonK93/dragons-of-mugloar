# Dragons of Mugloar

<img src="./assets/readme-banner.png" alt="Dragons of Mugloar banner" width="900">

This application solves two challenges from [Dragons of Mugloar](https://dragonsofmugloar.com/):

- **Visual Adventure**: provides a visual interface for playing the game and making the right choices.
- **Scripting Adventure**: implements backend logic that plays the game automatically using its API.

## Project goals

- Create a web app based on the provided instructions.
- Ensure responsiveness and cross-browser compatibility.
- Implement state management.
- Develop a program that reaches 1,000+ points in the game.
- Ensure proper error handling and input validation.
- Write unit tests to verify the code, including backend business logic (48 backend tests added).

## Features

- **Frontend**
  - **Manual play**
    - Start a new game and view the current game state.
    - Refresh the shop, view available items, and buy them.
    - View purchased items in the inventory.
    - Request the player's reputation.
    - Request and solve quests.
    - Receive notifications about quest and purchase results.
    - Start a new game after the adventure ends.
  - **Auto-play**
    - Start an automated game.
    - Follow its progress and view the action log, score, and turn count.
    - Start a new game after the adventure ends.
- **Backend**
  - Provides endpoints for manual play.
  - Starts auto-play on request, tracks its progress, and maintains an action log.
  - Records completed auto-play game statistics by score range in `game-statistics.json`.
  - Integrates with the Dragons of Mugloar API for game actions.
  - Schedules auto-play turns and removes completed games from the cache after 24 hours.

## Used Technologies

- **Frontend:** React, Redux Toolkit, React Redux, React Toastify, TypeScript, CSS Modules, Vite.
- **Backend:** Node.js, TypeScript, Fastify, Zod, Pino.
- **Testing and tooling:** Node.js test runner, ESLint, Prettier, npm.

## Getting Started

Install Node.js and npm. Node.js 24 is recommended.

Start the backend from the repository root:

```sh
cd backend
npm ci
npm run build
npm start
```

In a second terminal, start the frontend from the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The backend runs at
`http://localhost:3000`.

The backend's CORS policy allows `http://localhost:5173` and `http://127.0.0.1:5173`.
To use a different frontend origin, update `frontendOrigins` in
[`backend/src/config.ts`](./backend/src/config.ts).

## Testing

Run the backend unit tests from the repository root:

```sh
cd backend
npm test
```

The frontend currently has no tests.

## API

The backend exposes these endpoints:

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/game/start` | Start a manual game. |
| POST | `/game/:gameId/investigate/reputation` | Check reputation. |
| GET | `/game/:gameId/messages` | List quests. |
| POST | `/game/:gameId/solve/:adId` | Solve a quest. |
| GET | `/game/:gameId/shop` | List shop items. |
| GET | `/game/:gameId/shop/buy/:itemId` | Buy an item. |
| POST | `/game/auto-play` | Start an automated game. |
| GET | `/game/:gameId/auto-play` | Get the auto-play action log. |

## Statistics

Completed auto-play games are recorded in `game-statistics.json` in the repository root.
The file is created when the first completed game is recorded and persists across backend
restarts. It contains game counts and percentages by score range.

## Auto-play game strategy

On each cycle, auto-play uses the latest recorded game state:

1. If the player has one life or less and at least 50 gold, it buys a healing potion and ends
   the cycle.
2. Otherwise, it buys the most expensive available non-potion item while reserving 50 gold
   for a potion. If an item is bought, the cycle ends.
3. If no item is bought, it retrieves the quests, decodes Base64 or ROT13 messages when needed,
   and selects the quest with the highest known success probability. If probabilities are equal,
   it prefers the quest that expires sooner. Unknown probabilities have lower priority than known
   ones.
4. If the selected quest contains `Steal` or `Infiltrate`, it checks reputation and refreshes the
   quest list. The reputation check consumes a turn and is recorded in the action log. When state
   reputation is negative, it prioritizes quests without those keywords.
5. It solves the selected quest and records the result in the action log.

If the shop or quest list is empty, the current cycle ends with an error and auto-play retries
in a later cycle.

When the game API returns HTTP 410, auto-play marks the game as over and records the last known
score in the statistics.

## Load Testing

To load-test auto-play, use Postman to send multiple requests to
`POST http://localhost:3000/game/auto-play`.
Each request starts a new game and sends traffic to the external Dragons of Mugloar API,
so keep the test within its permitted usage limits.

## Limitations

- The auto-play action log is stored in memory and is lost when the server restarts.
- Refreshing the page resets the frontend auto-play state, but the game continues on the server.
- The backend is intended for a single process: the cache is not shared, and concurrent processes
  can conflict when writing statistics.
- When the game API returns HTTP 410, it does not provide a final score, so statistics use the
  score from the last recorded action. This may be outdated if an action succeeded but its response
  was not received.
- The application depends on the availability of the external game API.
- In a sample of 50 auto-play games, approximately 0% scored below 1,000 points, 20% scored
  1,000–1,999 points, and 80% scored 2,000 or more. Individual results may vary.