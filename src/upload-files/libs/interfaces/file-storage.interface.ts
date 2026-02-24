import { Stats } from 'node:fs';

export interface IFileStorage {
  save(path: string, buffer: Buffer): Promise<void>;
  delete(paths: string[]): Promise<void>;
  getStats(path: string): Promise<Stats>;
}
