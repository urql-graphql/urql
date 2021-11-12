export class Dependencies {
  [prop: string]: unknown;
  view: DataView;
  keys: Set<string> | undefined;

  constructor() {
    this.view = new DataView(new ArrayBuffer(8192));
  }

  add(key: string) {
    let h = 5381;
    for (let i = 0, l = key.length; i < l; i++)
      h = ((h << 5) + h) ^ key.charCodeAt(i);
    const idx = h >>> 20;
    this.view.setUint32(idx, this.view.getUint32(idx) | (1 << h % 32));
  }

  merge(other: Dependencies) {
    for (let i = 0; i < 8192; i += 4) {
      const x = this.view.getInt32(i) | other.view.getInt32(i);
      this.view.setInt32(i, x);
    }
  }

  intersects(other: Dependencies) {
    for (let i = 0; i < 8192; i += 4)
      if (this.view.getUint32(i) & other.view.getUint32(i)) return true;
    return false;
  }
}
