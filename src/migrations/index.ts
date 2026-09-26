import * as migration_20260926_192356_initial from './20260926_192356_initial';

export const migrations = [
  {
    up: migration_20260926_192356_initial.up,
    down: migration_20260926_192356_initial.down,
    name: '20260926_192356_initial'
  },
];
