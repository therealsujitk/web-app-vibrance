import apiRouter from './api'
import express from 'express'
import { adminRouter, docsRouter, homeRouter } from './frontend'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/public'))

app.use('/api', apiRouter)
app.use('/admin', adminRouter)
app.use('/docs', docsRouter)
app.use('/', homeRouter)

export default app
