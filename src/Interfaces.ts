import { Document } from 'mongoose'

export interface IUser extends Document {
  firstName: string
  lastName: string
  email: string
  password: string
  joined: Date

  bookshelves: IShelf[]
}

export interface IBook extends Document {
  title: string
  subtitle?: string
  author?: string
  description?: string
  image?: string
  pages?: number
  publishedDate?: Date
  isbn?: string
  isbn13?: string
  averageRating?: number
  ratingsCount?: number

  ratings: IRating[]
}

export interface IShelf extends Document {
  title: string
  default: boolean // to be created for each user, can't be deleted - 'Reading', 'Read', 'Want to Read'

  user: IUser
  books: IBook[]
}

export interface IRating extends Document {
  rating: number
  review: string

  book: IBook
  user: IUser
}
