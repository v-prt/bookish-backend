import { Response, Request } from 'express'
import { IBook } from '../Interfaces'
import { Book } from '../Models'
import axios from 'axios'

// (CREATE/POST) ADD NEW BOOK
export const createBook = async (req: Request, res: Response) => {
  try {
    // create new book object
    const book: IBook = new Book(req.body)
    // save book to db
    const newBook: IBook = await book.save()

    return res.status(201).json({
      newBook,
    })
  } catch (err) {
    if (err instanceof Error) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}

export const searchBooks = async (req: Request, res: Response) => {
  const { userId } = req.params
  const { searchText, pageParam } = req.query

  const page = Number(pageParam) || 0

  try {
    const maxResults = 20
    const startIndex = page * maxResults

    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${searchText}&startIndex=${startIndex}&maxResults=${maxResults}`
    )

    const { items, totalItems } = response.data

    const structuredBooks = await Promise.all(
      items?.map(async (book: any) => {
        const userBook = await Book.findOne({ userId, volumeId: book.id }).lean()

        return {
          ...userBook,
          volumeId: book.id,
          title: book.volumeInfo.title,
          image: book.volumeInfo.imageLinks?.thumbnail,
          author: book.volumeInfo.authors?.[0],
          averageRating: book.volumeInfo.averageRating,
          ratingsCount: book.volumeInfo.ratingsCount,
        }
      })
    )

    const nextPage = totalItems > maxResults * page ? page + 1 : null

    res.json({
      items: structuredBooks,
      totalItems,
      nextPage,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'An error occurred while processing the request.' })
  }
}

// (READ/GET) GET USER'S BOOK BY USER ID & VOLUME ID
export const getBook = async (req: Request, res: Response) => {
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
export const getBookshelf = async (req: Request, res: Response) => {
  try {
    const { userId, page } = req.params
    const { bookshelf, search } = req.query

    const limit = 20
    const skip = (Number(page) - 1) * limit

    let where = {}

    if (bookshelf === 'Owned') {
      where = { owned: true }
    } else if (bookshelf === 'Rated') {
      where = { rating: { $gt: 0 } }
    } else where = { bookshelf }

    if (search) {
      where = {
        ...where,
        // search by title or author (case insensitive)
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { author: { $regex: search, $options: 'i' } },
        ],
      }
    }

    const totalBooks = await Book.count({ userId, ...where })
    const books: IBook[] = await Book.find({ userId, ...where })
      .skip(skip)
      .limit(limit)
      .sort({ dateRead: -1 })
      .lean()

    // for each book, get info from google books api
    const results = await Promise.all(
      books.map(async book => {
        const { data } = await axios.get(
          `https://www.googleapis.com/books/v1/volumes/${book.volumeId}`
        )
        return {
          // title: data.volumeInfo.title,
          image: data.volumeInfo.imageLinks?.thumbnail,
          // author: data.volumeInfo.authors?.[0],
          averageRating: data.volumeInfo.averageRating,
          ratingsCount: data.volumeInfo.ratingsCount,
          ...book,
        }
      })
    )

    const nextPage = totalBooks > limit * Number(page) ? Number(page) + 1 : null

    return res.status(200).json({
      books: results,
      totalBooks,
      nextPage,
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
  const { bookId } = req.params

  try {
    // update bookshelf, owned, read, rating, or review
    const filter = { _id: bookId }
    const update = { $set: req.body }

    const updatedBook = await Book.updateOne(filter, update)
    return res.status(200).json({ updatedBook })
  } catch (err) {
    if (err instanceof Error) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}

export const deleteBook = async (req: Request, res: Response) => {
  const { bookId } = req.params

  try {
    await Book.deleteOne({ _id: bookId })
    return res.status(200).json({ message: 'Book removed' })
  } catch (err) {
    if (err instanceof Error) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}

export const getBookshelfSummaries = async (req: Request, res: Response) => {
  const { userId } = req.params

  try {
    const numRated = await Book.countDocuments({ userId, rating: { $gt: 0 } })
    let ratedBooks = await Book.find({ userId, rating: { $gt: 0 } })
      .limit(3)
      .lean()

    const numOwned = await Book.countDocuments({ userId, owned: true })
    let ownedBooks = await Book.find({ userId, owned: true }).limit(3).lean()

    const numWantToRead = await Book.countDocuments({
      userId,
      bookshelf: 'Want to read',
    })
    let wantToReadBooks = await Book.find({ userId, bookshelf: 'Want to read' }).limit(3).lean()

    const numRead = await Book.countDocuments({ userId, bookshelf: 'Read' })
    let readBooks = await Book.find({ userId, bookshelf: 'Read' }).limit(3).lean()

    let books = [
      { id: 'want-to-read', label: 'Want to read', books: wantToReadBooks, count: numWantToRead },
      { id: 'read', label: 'Read', books: readBooks, count: numRead },
      { id: 'rated', label: 'Rated', books: ratedBooks, count: numRated },
      { id: 'owned', label: 'Owned', books: ownedBooks, count: numOwned },
    ]

    // for each array of books, get info from google books api
    books = await Promise.all(
      books.map(async group => {
        group.books = await Promise.all(
          group.books.map(async (book: any) => {
            const { data } = await axios.get(
              `https://www.googleapis.com/books/v1/volumes/${book.volumeId}`
            )
            return {
              image: data.volumeInfo.imageLinks?.thumbnail,
              averageRating: data.volumeInfo.averageRating,
              ratingsCount: data.volumeInfo.ratingsCount,
              pageCount: data.volumeInfo.pageCount,
              categories: data.volumeInfo.categories,
              ...book,
            }
          })
        )
        return group
      })
    )

    const currentlyReading = await Book.find({
      userId,
      bookshelf: 'Currently reading',
    }).lean()

    // get book data for currently reading
    const readingData = await Promise.all(
      currentlyReading.map(async book => {
        const { data } = await axios.get(
          `https://www.googleapis.com/books/v1/volumes/${book.volumeId}`
        )
        return {
          image: data.volumeInfo.imageLinks?.thumbnail,
          averageRating: data.volumeInfo.averageRating,
          ratingsCount: data.volumeInfo.ratingsCount,
          pageCount: data.volumeInfo.pageCount,
          categories: data.volumeInfo.categories,
          ...book,
        }
      })
    )

    return res.status(200).json({
      books,
      currentlyReading: readingData,
    })
  } catch (err) {
    if (err instanceof Error) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}

export const getBookReviews = async (req: Request, res: Response) => {
  const { volumeId, page } = req.params

  const limit = 10
  const skip = (Number(page) - 1) * limit

  try {
    // get all books by id with ratings/reviews
    const totalReviews = await Book.count({
      volumeId,
      review: {
        $exists: true,
      },
    })
    const reviews: IBook[] = await Book.find({
      volumeId,
      rating: {
        $gt: 0,
      },
      review: {
        $exists: true,
      },
    })
      .skip(skip)
      .limit(limit)
      .populate('userId') // include user data with review
      .sort({
        // sort by review date
        'review.date': -1,
      })
      .lean()

    const nextPage = totalReviews > limit * Number(page) ? Number(page) + 1 : null

    return res.status(200).json({
      reviews,
      totalReviews,
      nextPage,
    })
  } catch (err) {
    if (err instanceof Error) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}
