import z from "zod";

const countsSchema = z.object({
    below1000: z.number().int().nonnegative(),
    between1000To1999: z.number().int().nonnegative(),
    from2000: z.number().int().nonnegative(),
});

export const statisticsSchema = z.object({
    below1000Percent: z.number().min(0).max(100),
    between1000To1999Percent: z.number().min(0).max(100),
    from2000Percent: z.number().min(0).max(100),
    completedGames: z.number().int().nonnegative(),
    counts: countsSchema,
});
