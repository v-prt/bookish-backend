import { Response, Request } from 'express'
import { IUser } from '../Interfaces'
import { User, Book } from '../Models'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv'
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
      // include user's books
      const books = await Book.find({ userId: user._id }).lean()

      return res.status(200).json({
        user: {
          ...user,
          books,
        },
      })
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
