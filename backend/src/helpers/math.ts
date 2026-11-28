import { InternalServerError } from "../errors/errors.js";
import { formatNumberToDecimalPlaces } from "./format.js";

export const percentage = (count: number, total: number): number => {
    if (!Number.isFinite(count) || !Number.isFinite(total) || total <= 0) {
        throw new InternalServerError("Cannot calculate percentage with invalid count or total");
    }
    return formatNumberToDecimalPlaces((count / total) * 100, 2);
};
