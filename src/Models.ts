import { IUser, IBook } from './Interfaces'
import { model, Schema } from 'mongoose'
const ObjectId = Schema.Types.ObjectId

const UserSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  joined: { type: Date, default: Date.now },
  faveGenres: [{ type: String }],

  books: [{ type: ObjectId, ref: 'Book' }],
})

const BookSchema: Schema = new Schema({
  volumeId: { type: String, required: true }, // google books api volume id (for fetching book info)
  userId: { type: ObjectId, ref: 'User' }, // link user to book
  bookshelf: { type: String, required: true }, // bookshelf name (read, currently reading, want to read)
  owned: { type: Boolean, default: false }, // to indicate if user owns the book
  read: { type: Date }, // date user finished reading book (can be used to indicate if user had read book)
  rating: { type: Number }, // user's rating
  review: { type: String }, // user's review
})

export const User = model<IUser>('User', UserSchema)
export const Book = model<IBook>('Book', BookSchema)
