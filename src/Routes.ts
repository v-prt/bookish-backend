import { Router } from 'express'

import {
  createUser,
  authenticateUser,
  verifyToken,
  getUser,
  updateUser,
  deleteUser,
  getReadingActivity,
} from './controllers/UserController'

import {
  createBook,
  userGetBookByVolumeId,
  userGetBookshelves,
  updateBook,
  deleteBook,
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
  .post(`${API_URL}/books`, createBook)
  .get(`${API_URL}/books/:userId/:volumeId`, userGetBookByVolumeId)
  .get(`${API_URL}/bookshelf/:userId`, userGetBookshelves)
  .put(`${API_URL}/books/:bookId`, updateBook)
  .delete(`${API_URL}/books/:bookId`, deleteBook)
