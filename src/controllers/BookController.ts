import { Response, Request } from 'express'
import { IBook } from '../Interfaces'
import { Book } from '../Models'
import axios from 'axios'
const mongodb = require('mongodb')
const { ObjectId } = mongodb

// (CREATE/POST) ADD NEW BOOK
export const createBook = async (req: Request, res: Response) => {
  try {
    const { volumeId, userId, bookshelf, owned, read, rating, review } = req.body
    // create new book object
    const book: IBook = new Book({
      volumeId,
      userId,
      bookshelf,
      owned,
      read,
      rating,
      review,
    })
    // save book to db
    const newBook: IBook = await book.save()

    return res.status(201).json({
      data: newBook,
    })
  } catch (err) {
    if (err instanceof Error) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}

// (READ/GET) GET USER'S BOOK BY USER ID & VOLUME ID
export const userGetBookByVolumeId = async (req: Request, res: Response) => {
  try {
    const { userId, volumeId } = req.params

    const book = await Book.findOne({ userId, volumeId })

    return res.status(200).json({
      book,
    })
  } catch (err) {
    if (err instanceof Error) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}

// (READ/GET) GET USER'S BOOKS BY USER ID & BOOKSHELF
// TODO: pagination
export const userGetBookshelves = async (req: Request, res: Response) => {
  try {
    const { userId, bookshelf } = req.params
    const books: IBook[] = await Book.find({ userId, bookshelf })

    // for each book, get info from google books api
    const booksWithInfo = await Promise.all(
      books.map(async book => {
        const response = await axios.get(
          `https://www.googleapis.com/books/v1/volumes/${book.volumeId}`
        )
        return { ...book.toObject(), ...response.data } // merge book info with book object
      })
    )

    return res.status(200).json({
      data: booksWithInfo,
    })
  } catch (err) {
    if (err instanceof Error) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}

// (UPDATE/PUT) UPDATE BOOK BY ID
export const updateBook = async (req: Request, res: Response) => {
  const bookId = new ObjectId(req.params.id)

  try {
    // update bookshelf, owned, read, rating, or review
    const filter = { _id: bookId }
    const update = { $set: req.body }

    const result = await Book.updateOne(filter, update)
    return res.status(200).json({ data: result })
  } catch (err) {
    if (err instanceof Error) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}
