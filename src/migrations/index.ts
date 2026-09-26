import * as migration_20260926_194844_initial from './20260926_194844_initial';

export const migrations = [
  {
    up: migration_20260926_194844_initial.up,
    down: migration_20260926_194844_initial.down,
    name: '20260926_194844_initial'
  },
];
