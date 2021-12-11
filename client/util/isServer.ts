// Do not run on the server
// export const isServer = () => typeof window === undefined;
export const isServer = () => typeof window === "undefined" || typeof window === undefined;