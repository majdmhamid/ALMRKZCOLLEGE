import * as migration_20260926_194844_initial from './20260926_194844_initial';
import * as migration_20260929_134125_s3_object_key from './20260929_134125_s3_object_key';

export const migrations = [
  {
    up: migration_20260926_194844_initial.up,
    down: migration_20260926_194844_initial.down,
    name: '20260926_194844_initial',
  },
  {
    up: migration_20260929_134125_s3_object_key.up,
    down: migration_20260929_134125_s3_object_key.down,
    name: '20260929_134125_s3_object_key'
  },
];
