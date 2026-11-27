export const formatNumberToDecimalPlaces = (value: number, decimalPlaces: number): number => {
    return Number(value.toFixed(decimalPlaces));
};
