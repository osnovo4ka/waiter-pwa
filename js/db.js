/** Локальное хранение: IndexedDB + запасной localStorage. */
const DB = (() => {
  const NAME = "waiter-notebook";
  const VER = 1;
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, VER);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  async function get(key) {
    try {
      const db = await open();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction("kv", "readonly");
        const r = tx.objectStore("kv").get(key);
        r.onsuccess = () => resolve(r.result === undefined ? null : r.result);
        r.onerror = () => reject(r.error);
      });
    } catch (e) {
      const raw = localStorage.getItem("wn:" + key);
      return raw ? JSON.parse(raw) : null;
    }
  }

  async function set(key, value) {
    try {
      const db = await open();
      await new Promise((resolve, reject) => {
        const tx = db.transaction("kv", "readwrite");
        tx.objectStore("kv").put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      localStorage.setItem("wn:" + key, JSON.stringify(value));
    }
  }

  return { get, set };
})();

const Store = {
  state: null,

  empty() {
    return {
      activeShift: null,
      shifts: [],
      stopList: [],
      orders: {},
    };
  },

  async load() {
    const saved = await DB.get("state");
    this.state = saved && typeof saved === "object" ? Object.assign(this.empty(), saved) : this.empty();
    if (!this.state.orders) this.state.orders = {};
    if (!Array.isArray(this.state.shifts)) this.state.shifts = [];
    if (!Array.isArray(this.state.stopList)) this.state.stopList = [];
    return this.state;
  },

  async save() {
    await DB.set("state", this.state);
  },

  uid(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  },
};
