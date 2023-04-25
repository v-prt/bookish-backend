import express, { Express, Request, Response } from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { routes } from './routes'

dotenv.config()

const app: Express = express()
const port = process.env.PORT

app
  .use(morgan('tiny'))
  .use(routes)
  .get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server')
  })

const uri: string = `${process.env.MONGO_URI}`

mongoose
  .connect(uri)
  .then(() =>
    app.listen(port, () => {
      console.info(`⚡️[server]: Server is running at http://localhost:${port}`)
    })
  )
  .catch(err => console.error(err))
