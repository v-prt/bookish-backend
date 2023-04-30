import express, { Express, Request, Response } from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { routes } from './routes'

dotenv.config()

const app: Express = express()
const port = process.env.PORT

app
  .use(function (req, res, next) {
    res.header('Access-Control-Allow-Methods', 'OPTIONS, HEAD, GET, PUT, POST, DELETE, PATCH')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
  })
  .use(morgan('tiny'))
  .use(express.json())
  .use(routes)

const uri: string = `${process.env.MONGO_URI}`

mongoose
  .connect(uri)
  .then(() =>
    app.listen(port, () => {
      console.info(`⚡️[server]: Server is running at http://localhost:${port}`)
    })
  )
  .catch(err => console.error(err))
