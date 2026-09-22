import { isStorageAvailable } from "./isStorageAvailable";

type StorageSettings<T> = {
  serialise: (state: T) => string;
  deserialise: (str: string) => T;
  id: string;
  type?: 'localStorage' | 'sessionStorage';
}

type Settings<T> = {
  storage?: StorageSettings<T>;
  areEqual?: (state1: T, state2: T) => boolean;
}

type Listener<T> = (state: T, prevState: T) => void;

export default class ObservableState<T> {
  private static lsIds: string[] = [];
  private static ssIds: string[] = [];

  private defVal: T;
  private data: T;
  private subscribers: Listener<T>[] = [];
  private settings?: Settings<T>;

  // Timeout for disk writing, to avoid spamming changes to disk
  private diskWriteTimeout?: number;

  private readonly boundUpdateStorage = this.updateStorage.bind(this);

  constructor(defaultVal: T, settings?: Settings<T>) {
    this.defVal = defaultVal;
    this.data = defaultVal;

    if (settings?.storage) {
      const mng = settings.storage;
      if (mng.type === 'localStorage' || !mng.type) {
        if (ObservableState.lsIds.some(id => id === mng.id)) {
          throw Error("duplicate local storage state id");
        } else {
          ObservableState.lsIds.push(mng.id);
        }
      } else if (mng.type === 'sessionStorage') {
        if (ObservableState.ssIds.some(id => id === mng.id)) {
          throw Error("duplicate session storage state id");
        } else {
          ObservableState.ssIds.push(mng.id);
        }
      }

      const strgType = mng.type || 'localStorage';
      if (isStorageAvailable(strgType)) {
        const stored = window[strgType].getItem(settings.storage.id);
        if (stored !== null) {
          this.data = settings.storage.deserialise(stored);
        }
      }
    }

    this.settings = settings;
  }

  set(state: T): void {
    if (!this.equals(state)) {
      this.subscribers.forEach(sub => sub(state, this.data));
      this.data = state;

      // Write new value to disk if applicable
      if (this.settings?.storage) {
        // Write with a delay to avoid needless writes to disk when values change too quickly
        if (this.diskWriteTimeout === undefined) {
          clearTimeout(this.diskWriteTimeout);
        }
        this.diskWriteTimeout = window.setTimeout(this.boundUpdateStorage, 1000);
      }
    }
  }

  reset(): void {
    this.set(this.defVal);
  }

  get(): T {
    return this.data;
  }

  getDefault(): T {
    return this.defVal;
  }

  /**
   * @returns unsubscribe function
   */
  subscribe(listener: Listener<T>): () => void {
    if (!this.subscribers.some(s => s === listener)) {
      this.subscribers.push(listener);
    }

    return () => this.unsubscribe(listener);
  }

  unsubscribe(listener: Listener<T>): void {
    this.subscribers = this.subscribers.filter(s => s !== listener);
  }

  equals(state: T): boolean {
    return this.settings?.areEqual?.(this.get(), state) || (this.get() == state);
  }

  isSerialisable(): boolean {
    return !!this.settings?.storage
  }

  serialise(): string {
    if (!this.settings?.storage) throw Error("Cannot serialise: not serialisable")
    return this.settings.storage.serialise(this.data);
  }

  deserialise(newState: string): void {
    if (!this.settings?.storage) throw Error("Cannot deserialise: not serialisable")
    this.set(this.settings.storage.deserialise(newState));
  }

  updateStorage(): void {
    if (this.settings?.storage) {
      const stType = this.settings.storage.type || 'localStorage';
      if (this.equals(this.defVal)) {
        window[stType].removeItem(this.settings.storage.id);
      } else {
        window[stType].setItem(this.settings.storage.id, this.serialise());
      }
    }

    // Clear disk write timeout if it exists since we just wrote
    if (this.diskWriteTimeout !== undefined) {
      clearTimeout(this.diskWriteTimeout);
    }
    this.diskWriteTimeout = undefined;
  }
}
