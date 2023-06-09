import { Document } from 'mongoose'

export interface IUser extends Document {
  firstName: string
  lastName: string
  email: string
  password: string
  joined: Date
  faveGenres: string[]

  books: string[]
}

export interface IBook extends Document {
  title: string
  author: string
  bookshelf: string
  owned: boolean
  dateRead?: Date
  rating?: number
  review?: {
    date: Date
    text: string
  }

  volumeId: string
  userId: string
}
