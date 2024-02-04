import fs from 'fs'

// Moving admin build files
fs.rmSync('../dist/frontend/admin/dist', { recursive: true, force: true })
fs.cpSync('./admin/dist', '../dist/frontend/admin/dist', { recursive: true })

// Moving docs build files
fs.rmSync('../dist/frontend/docs/dist', { recursive: true, force: true })
fs.cpSync('./docs/dist', '../dist/frontend/docs/dist', { recursive: true })
