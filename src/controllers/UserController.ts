import { Response, Request } from 'express'
import { IBook, IUser } from '../Interfaces'
import { User, Book } from '../Models'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv'
import axios from 'axios'
dotenv.config()
const mongodb = require('mongodb')
const { ObjectId } = mongodb
const saltRounds = 10

const tokenSecret: string = process.env.TOKEN_SECRET || ''

// (CREATE/POST) ADDS A NEW USER
export const createUser = async (req: Request, res: Response) => {
  try {
    const hashedPwd = await bcrypt.hash(req.body.password, saltRounds)
    const existingEmail = await User.findOne({
      email: { $regex: new RegExp(`^${req.body.email}$`, 'i') },
    })
    const existingUsername = await User.findOne({
      username: { $regex: new RegExp(`^${req.body.username}$`, 'i') },
    })

    if (existingEmail) {
      return res.status(409).json({ message: 'That email is already in use' })
    } else if (existingUsername) {
      return res.status(409).json({ message: 'That username is taken' })
    } else {
      const user: IUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: hashedPwd,
      })
      const newUser: IUser = await user.save()

      return res.status(201).json({
        data: user,
        token: jwt.sign({ userId: newUser._id }, tokenSecret, {
          expiresIn: '7d',
        }),
      })
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}

// (READ/POST) AUTHENTICATES USER WHEN LOGGING IN
export const authenticateUser = async (req: Request, res: Response) => {
  try {
    const user: IUser | null = await User.findOne({
      email: { $regex: new RegExp(`^${req.body.email}$`, 'i') },
    })
    if (user) {
      const isValid = await bcrypt.compare(req.body.password, user.password)
      if (isValid) {
        return res.status(200).json({
          token: jwt.sign({ userId: user._id }, tokenSecret, {
            expiresIn: '7d',
          }),
          data: user,
        })
      } else {
        return res.status(403).json({ message: 'Incorrect password' })
      }
    } else {
      return res.status(404).json({ message: 'User not found' })
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.stack)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}

// (READ/POST) VERIFIES JWT TOKEN
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const verifiedToken = jwt.verify(req.body.token, tokenSecret, (err: any, decoded: any) => {
      if (err) {
        return false
      } else {
        return decoded.userId
      }
    })
    if (verifiedToken !== null) {
      try {
        const user: IUser | null = await User.findOne({
          _id: new ObjectId(verifiedToken),
        })
        if (user) {
          return res.status(200).json({ user: user })
        } else {
          return res.status(404).json({ message: 'User not found' })
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error(err.stack)
          return res.status(500).json({ message: 'Internal server error' })
        }
      }
    } else {
      return res.status(400).json({ message: `Token couldn't be verified` })
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.stack)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}

export const getUser = async (req: Request, res: Response) => {
  try {
    const user: IUser | null = await User.findOne({ _id: new ObjectId(req.params.id) }).lean()

    if (user) {
      return res.status(200).json({ ...user })
    } else {
      return res.status(404).json({ message: 'User not found' })
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.stack)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}

export const updateUser = async (req: Request, res: Response) => {
  const userId = new ObjectId(req.params.id)
  const { email, currentPassword, newPassword } = req.body

  try {
    const filter = { _id: userId }
    const user: IUser | null = await User.findOne(filter)

    let updates = {}

    if (user && newPassword) {
      const passwordValid = await bcrypt.compare(currentPassword, user.password)
      if (!passwordValid) {
        return res.status(400).json({ message: 'Incorrect password' })
      } else {
        const hashedPwd = await bcrypt.hash(newPassword, saltRounds)
        updates = { password: hashedPwd }
      }
    } else {
      updates = req.body
    }

    const existingEmail: IUser | null = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') },
    })

    if (existingEmail && !existingEmail._id.equals(userId)) {
      return res.status(400).json({ message: 'That email is already in use' })
    } else {
      const update = {
        $set: updates,
      }
      const result = await User.updateOne(filter, update)
      return res.status(200).json({ data: result })
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.stack)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    const deleteUserPromise = User.deleteOne({ _id: new ObjectId(id) })
    const deleteBooksPromise = Book.deleteMany({ userId: new ObjectId(id) })

    await Promise.all([deleteUserPromise, deleteBooksPromise])

    return res
      .status(200)
      .json({ message: 'Your account and books have been deleted successfully.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const getReadingActivity = async (req: Request, res: Response) => {
  const { id } = req.params
  const { dateRange } = req.query // all-time, this-year

  try {
    const books = await Book.find({
      userId: id,
      bookshelf: 'Read',
      dateRead: {
        $gte: new Date(dateRange === 'all-time' ? 0 : new Date().getFullYear(), 0, 1),
      },
    })
      .sort({ dateRead: -1 })
      .lean()

    // for each book, get info from google books api
    const results = await Promise.all(
      books.map(async book => {
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

    const recentlyRead = results.slice(0, 5) // most recent 5 books

    // READING ANALYTICS
    const { totalPages, categories, authors } = results.reduce(
      (acc, book) => {
        return {
          totalPages: acc.totalPages + book.pageCount,
          categories: [...acc.categories, ...(book.categories || ['Uncategorized'])],
          authors: [...acc.authors, book.author],
        }
      },
      { totalPages: 0, categories: [] as string[], authors: [] as string[] }
    )

    // for each category, remove slashes to clean up google books api format and flatten array
    let cleanedCats = categories.map((string: string) => string.split(' / ')).flat()

    // count occurrences of each category
    const categoryCounts = cleanedCats.reduce((acc: any, cat: any) => {
      if (!acc[cat]) {
        acc[cat] = 1
      } else {
        acc[cat]++
      }
      return acc
    }, {})

    // ignore common categories
    const commonCats = ['Fiction', 'Nonfiction', 'General']
    commonCats.forEach(cat => delete categoryCounts[cat])

    // get key with highest value to find top category
    const topCategory = Object.keys(categoryCounts).reduce((a, b) =>
      categoryCounts[a] > categoryCounts[b] ? a : b
    )

    // count occurrences of each author
    const authorCounts = authors.reduce((acc: any, author: any) => {
      if (!acc[author]) {
        acc[author] = 1
      } else {
        acc[author]++
      }
      return acc
    }, {})

    let topAuthor = Object.keys(authorCounts).reduce((a, b) =>
      authorCounts[a] > authorCounts[b] ? a : b
    )

    // only return top author if they appear more than once
    if (authorCounts[topAuthor] <= 1) {
      topAuthor = ''
    }

    return res.status(200).json({
      totalBooks: results.length,
      totalPages,
      topCategory,
      topAuthor,
      recentlyRead,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const getRecommendedBooksByGenre = async (req: Request, res: Response) => {
  const { id } = req.params
  const { genre } = req.query

  try {
    // improve results from google books api by searching for "highly rated" books
    const searchText = `highly rated ${genre} books`
    const maxResults = 6

    let recommendedBooks: any[] = []

    let startIndex = 0
    while (recommendedBooks.length < maxResults) {
      const { data } = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${searchText}&maxResults=${maxResults}&startIndex=${startIndex}`
      )

      const filteredBooks = await Promise.all(
        data.items.map(async (book: any) => {
          // ignore books that are already in user's bookshelves
          const existingBook: IBook | null = await Book.findOne({
            userId: new ObjectId(id),
            volumeId: book.id,
          })
          return existingBook
            ? null
            : {
                // structured book
                volumeId: book.id,
                title: book.volumeInfo.title,
                image: book.volumeInfo.imageLinks?.thumbnail,
                author: book.volumeInfo.authors?.[0],
                averageRating: book.volumeInfo.averageRating,
                ratingsCount: book.volumeInfo.ratingsCount,
              }
        })
      )

      // remove null values and add to recommendedBooks array
      filteredBooks.forEach(book => {
        if (!!book && recommendedBooks.length < maxResults) {
          recommendedBooks.push(book)
        }
      })

      // increment startIndex to get next page of results
      startIndex = startIndex + maxResults
    }

    return res.status(200).json({ recommendedBooks })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
