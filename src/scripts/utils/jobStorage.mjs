// Single key for all cached job data in localStorage.
const JOBS_STORAGE_KEY = "jobs:data:v1";

function localStorageAvailable() {
  // Protects code in environments without window/localStorage.
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredJobs(storageKey = JOBS_STORAGE_KEY) {
  // If storage is unavailable, return a safe default.
  if (!localStorageAvailable()) return [];

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Only trust arrays; anything else is treated as invalid cache.
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read jobs from storage:", error);
    return [];
  }
}

export function saveJobs(jobs, storageKey = JOBS_STORAGE_KEY) {
  if (!localStorageAvailable()) return;
  // Guard against accidental non-array writes.
  if (!Array.isArray(jobs)) return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(jobs));
  } catch (error) {
    console.error("Failed to save jobs to storage:", error);
  }
}

export function clearStoredJobs(storageKey = JOBS_STORAGE_KEY) {
  if (!localStorageAvailable()) return;
  // Useful when forcing a refresh from API/file on next load.
  window.localStorage.removeItem(storageKey);
}
