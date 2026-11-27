# Frontend

React application built with TypeScript and Vite.

```sh
npm install
npm run dev
```

The development server uses port `5173` and fails to start if that port is in use.

Run `npm run build` to type-check and create a production build, or `npm run lint`
to check the source with ESLint. Run `npm run lint-fix`
to apply formatting and other automatic fixes. Run `npm test` for the game-start tests.

Set the backend URL in `src/config.ts` (default: `http://localhost:3000`). Run the backend
before starting a game. The backend allows requests from `http://localhost:5173` and
`http://127.0.0.1:5173`. If the frontend uses a different origin, update
`frontendOrigins` in `backend/src/config.ts`, including the scheme and port.
The frontend URL is compiled into the bundle; rebuild it after changing `src/config.ts`.
The URL should end with `/` when it includes a path. Frontend API requests use
`fetchClient.withBaseUrl(...).getJson(...)` or `postJson(...)`, like the backend client.

Starting a game stores its data and reputation in Redux. Messages and merchant are not connected yet.
The inventory panel is a placeholder and is not connected yet.

Notifications use React Toastify. Call `toast` from components or other frontend code:

```ts
import { toast } from "react-toastify";

toast.success("Game started");
toast.error("Could not start the game");
toast.info("Welcome");
```

Notifications can be dismissed manually and disappear automatically after five seconds.
