// taken from:
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#feature-detecting_localstorage

const storageAvailablility: {[storageType: string]: boolean} = {};

export function isStorageAvailable(type: "localStorage" | "sessionStorage") {
  const memo = storageAvailablility[type];
  if (memo !== undefined) {
    return memo;
  }

  let storage;
  try {
    storage = window[type];
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    storageAvailablility[type] = true;
    return true;
  } catch (e) {
    const result = !!(
      e instanceof DOMException &&
      e.name === "QuotaExceededError" &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage &&
      storage.length !== 0
    );
    storageAvailablility[type] = result;
    return result;
  }
}