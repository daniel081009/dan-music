export default class file_db {
  constructor() {
    this.file = idb.openDB("file-db", 1, {
      upgrade(db) {
        db.createObjectStore("file");
      },
    });
  }
  async get(key) {
    return (await this.file).get("file", key);
  }
  async set(key, val) {
    return (await this.file).put("file", val, key);
  }
}
