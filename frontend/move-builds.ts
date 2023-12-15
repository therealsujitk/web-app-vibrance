import fs from 'fs';

// Moving admin build files
fs.rmSync('../dist/frontend/admin/dist', { recursive: true, force: true });
fs.renameSync('./admin/dist', '../dist/frontend/admin/dist');

// Moving docs build files
fs.rmSync('../dist/frontend/docs/dist', { recursive: true, force: true });
fs.renameSync('./docs/dist', '../dist/frontend/docs/dist');
