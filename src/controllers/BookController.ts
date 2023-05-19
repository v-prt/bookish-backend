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
  // FIXME: pages not working properly (totalItems doubles after each page and duplicate books appear)
  const { userId } = req.params
  const { searchText, pageParam } = req.query

  const page = Number(pageParam) || 0

  try {
    const maxResults = 20 // Specify the desired number of results per page
    const startIndex = page * maxResults // Specify the start index of the search results to return

    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${searchText}&startIndex=${startIndex}&maxResults=${maxResults}`
    )

    //  console.log(response.data)

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

    // const booksWithImages = structuredBooks.filter((book: any) => book.image !== undefined)

    const nextCursor = totalItems > maxResults * page ? page + 1 : null

    console.log('page', page)
    console.log('startIndex', startIndex)
    console.log('structuredBooks', structuredBooks?.length)
    console.log('totalItems', totalItems)
    console.log('nextCursor', nextCursor)

    res.json({
      items: structuredBooks,
      totalItems,
      nextCursor,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'An error occurred while processing the request.' })
  }
}

// (READ/GET) GET USER'S BOOK BY USER ID & VOLUME ID
export const userGetBookByVolumeId = async (req: Request, res: Response) => {
  try {
    const { userId, volumeId } = req.params
    console.log(userId, volumeId)

    const book = await Book.findOne({ userId, volumeId })
    console.log(book)

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
    const { userId } = req.params
    const { bookshelf } = req.query

    const books: IBook[] = await Book.find({ userId, bookshelf }).lean()
    const totalResults = await Book.count({ userId, bookshelf })

    // for each book, get info from google books api
    const results = await Promise.all(
      books.map(async book => {
        const { data } = await axios.get(
          `https://www.googleapis.com/books/v1/volumes/${book.volumeId}`
        )
        return {
          title: data.volumeInfo.title,
          image: data.volumeInfo.imageLinks?.thumbnail,
          author: data.volumeInfo.authors?.[0],
          averageRating: data.volumeInfo.averageRating,
          ratingsCount: data.volumeInfo.ratingsCount,
          ...book,
        }
      })
    )

    return res.status(200).json({
      books: results,
      totalResults,
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
