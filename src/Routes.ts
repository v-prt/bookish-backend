import { Router } from 'express'

import {
  createUser,
  authenticateUser,
  verifyToken,
  getUser,
  updateUser,
  deleteUser,
} from './controllers/UserController'

export const routes: Router = Router()
const API_URL = process.env.API_URL

routes
  .post(`${API_URL}/users`, createUser)
  .post(`${API_URL}/login`, authenticateUser)
  .post(`${API_URL}/token`, verifyToken)
  .get(`${API_URL}/users/:id`, getUser)
  .put(`${API_URL}/users/:id`, updateUser)
  .delete(`${API_URL}/users/:id`, deleteUser)
