export const STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === "true";
export function assetUrl(path: string) {
  return STATIC_DEMO ? import.meta.env.BASE_URL + path.replace(/^\//, "") : path;
}
