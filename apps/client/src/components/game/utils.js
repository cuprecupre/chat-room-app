export const capitalize = (s) =>
    typeof s === "string" && s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;

export const translateRole = (role) => {
    const roles = {
        friend: "amigo/a",
        impostor: "impostor/a",
    };
    return roles[role?.toLowerCase()] || role;
};
