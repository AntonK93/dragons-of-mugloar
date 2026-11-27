export const decodeBase64 = (value: string): string => {
    return Buffer.from(value, "base64").toString("utf-8");
};

export const decodeROT13 = (str: string): string => {
    return str.replace(/[a-zA-Z]/g, (char): string => {
        const isUpperCase = char === char.toUpperCase();
        const alphabet = isUpperCase ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "abcdefghijklmnopqrstuvwxyz";

        const position = alphabet.indexOf(char);
        return alphabet[(position + 13) % 26];
    });
};
