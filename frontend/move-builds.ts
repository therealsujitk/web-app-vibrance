import fs from 'fs';

// Moving admin build files
fs.rmSync('../dist/frontend/admin/build', { recursive: true, force: true });
fs.renameSync('./admin/build', '../dist/frontend/admin/build');

// Moving docs build files
fs.rmSync('../dist/frontend/docs/build', { recursive: true, force: true });
fs.renameSync('./docs/build', '../dist/frontend/docs/build');
