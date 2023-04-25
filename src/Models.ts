import { IUser, IBook, IShelf, IRating } from './Interfaces'
import { model, Schema } from 'mongoose'
const ObjectId = Schema.Types.ObjectId

const UserSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true },
  password: { type: String, required: true },
  joined: { type: Date, default: Date.now },

  bookshelves: [{ type: ObjectId, ref: 'Shelf' }],
})

const BookSchema: Schema = new Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  author: { type: String },
  description: { type: String },
  image: { type: String },
  pages: { type: Number },
  publishedDate: { type: Date },
  isbn: { type: String },
  isbn13: { type: String },
  averageRating: { type: Number },
  ratingsCount: { type: Number },

  ratings: [{ type: ObjectId, ref: 'Rating' }],
})

const ShelfSchema: Schema = new Schema({
  title: { type: String, required: true },
  default: { type: Boolean, default: false },

  user: { type: ObjectId, ref: 'User' },
  books: [{ type: ObjectId, ref: 'Book' }],
})

const RatingSchema: Schema = new Schema({
  rating: { type: Number, required: true },
  review: { type: String },

  book: { type: ObjectId, ref: 'Book' },
  user: { type: ObjectId, ref: 'User' },
})

export const User = model<IUser>('User', UserSchema)
export const Book = model<IBook>('Book', BookSchema)
export const Shelf = model<IShelf>('Shelf', ShelfSchema)
export const Rating = model<IRating>('Rating', RatingSchema)
