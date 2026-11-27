import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { ZodError } from "zod";
import { InternalServerError } from "../errors/errors";
import { statisticsSchema } from "../schemas/gameStatistics";
import { percentage } from "../helpers/math";

export class GameStatistics {
    private readonly filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    recordCompletedGame(gameId: string, score: number): void {
        if (!gameId || !Number.isFinite(score)) {
            throw new InternalServerError(
                "Cannot record game statistics with invalid game ID or score",
            );
        }

        let contents: string;
        try {
            contents = readFileSync(this.filePath, "utf8");
        } catch (error) {
            if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
                const message = error instanceof Error ? error.message : String(error);
                throw new InternalServerError(`Failed to read game statistics: ${message}`);
            }
            contents = JSON.stringify({
                below1000Percent: 0,
                between1000To1999Percent: 0,
                from2000Percent: 0,
                completedGames: 0,
                counts: {
                    below1000: 0,
                    between1000To1999: 0,
                    from2000: 0,
                },
            });
        }

        let saved: ReturnType<typeof statisticsSchema.parse>;
        try {
            saved = statisticsSchema.parse(JSON.parse(contents));
        } catch (error) {
            if (error instanceof SyntaxError || error instanceof ZodError) {
                throw new InternalServerError(`Invalid game statistics file: ${error.message}`);
            }
            throw error;
        }
        const counts = saved.counts;
        switch (true) {
            case score < 1_000:
                counts.below1000++;
                break;
            case score < 2_000:
                counts.between1000To1999++;
                break;
            default:
                counts.from2000++;
        }
        const completedGames = saved.completedGames + 1;
        const statistics = {
            below1000Percent: percentage(counts.below1000, completedGames),
            between1000To1999Percent: percentage(counts.between1000To1999, completedGames),
            from2000Percent: percentage(counts.from2000, completedGames),
            completedGames,
            counts,
        };

        const temporaryFile = `${this.filePath}.tmp`;
        writeFileSync(temporaryFile, `${JSON.stringify(statistics, null, 2)}\n`);
        renameSync(temporaryFile, this.filePath);
    }
}
