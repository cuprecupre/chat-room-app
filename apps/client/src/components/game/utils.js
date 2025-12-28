export const capitalize = (s) =>
    typeof s === "string" && s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;
