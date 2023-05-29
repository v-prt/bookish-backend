import { Router } from 'express'

import {
  createUser,
  authenticateUser,
  verifyToken,
  getUser,
  updateUser,
  deleteUser,
  getReadingActivity,
  getRecommendedBooksByGenre,
} from './controllers/UserController'

import {
  createBook,
  searchBooks,
  getBook,
  getBookshelf,
  updateBook,
  deleteBook,
  getBookshelfSummaries,
  getBookReviews,
} from './controllers/BookController'

export const routes: Router = Router()
const API_URL = '/bookish-api/v1'

routes
  .post(`${API_URL}/users`, createUser)
  .post(`${API_URL}/login`, authenticateUser)
  .post(`${API_URL}/token`, verifyToken)
  .get(`${API_URL}/users/:id`, getUser)
  .put(`${API_URL}/users/:id`, updateUser)
  .delete(`${API_URL}/users/:id`, deleteUser)
  .get(`${API_URL}/users/:id/reading-activity`, getReadingActivity)
  .get(`${API_URL}/users/:id/recommended-books`, getRecommendedBooksByGenre)
  .post(`${API_URL}/books`, createBook)
  .get(`${API_URL}/google-books/:userId`, searchBooks)
  .get(`${API_URL}/books/:userId/:volumeId`, getBook)
  .get(`${API_URL}/bookshelf/:userId/:page`, getBookshelf)
  .put(`${API_URL}/books/:bookId`, updateBook)
  .delete(`${API_URL}/books/:bookId`, deleteBook)
  .get(`${API_URL}/bookshelf-summaries/:userId`, getBookshelfSummaries)
  .get(`${API_URL}/reviews/:volumeId/:page`, getBookReviews)
