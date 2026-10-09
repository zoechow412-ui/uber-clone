// Expo Router gives src/app precedence over the legacy root app/ directory.
// Reuse the existing passenger implementation instead of duplicating UI code.
export { default } from "../../app/passenger";
