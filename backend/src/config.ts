import { fileURLToPath } from "node:url";

export const config = {
    frontendOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
    statisticsPath: fileURLToPath(new URL("../../game-statistics.json", import.meta.url)),
    gameApi: {
        baseUrl: "https://dragonsofmugloar.com/api/v2/",
        timeout: 5000,
        maxConcurrentRequests: 5,
    },
};

export const autoPlayConfig = {
    livesThreshold: 1,
    hpPotCost: 50,
    hpPotId: "hpot",
};
