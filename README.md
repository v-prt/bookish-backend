# Bookish Backend

This is the server and API for the Bookish mobile app. It is built with TypeScript, MongoDB, Node.js, and Express. This API is responsible for managing user accounts and the books they have added to their bookshelves. While the public Google Books API is used for searching and retrieving book information, this API handles the user-specific functionality.

## Technologies Used

- TypeScript
- MongoDB
- Node.js
- Express
- Mongoose (for defining schemas)

## Book Schema

The `Book` schema defines the structure of the books stored in the database. Here is an overview of the Book schema:

```typescript
const BookSchema: Schema = new Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  bookshelf: { type: String, required: true }, // bookshelf name (read, currently reading, want to read)
  owned: { type: Boolean, default: false }, // to indicate if user owns the book
  dateRead: { type: Date }, // date user finished reading book
  rating: { type: Number }, // user's rating (1-5)
  review: { date: { type: Date }, text: { type: String } }, // user's review

  volumeId: { type: String, required: true }, // google books api volume id (for fetching book info)
  userId: { type: ObjectId, ref: 'User' }, // link user to book
})
```

- `title` (required): The title of the book, used for searching in bookshelves.
- `author` (required): The author of the book, used for searching in bookshelves.
- `volumeId` (required): The Google Books API volume ID for fetching book information.
- `userId`: References the User model and links the book to a specific user.
- `bookshelf` (required): The name of the bookshelf where the book is categorized (read, currently reading, want to read).
- `owned`: Indicates whether the user owns the book (default is false).
- `read`: The date when the user finished reading the book (can be used to show reading history).
- `rating`: The user's rating for the book (ranging from 1 to 5).
- `review`: The user's review, including the review date and text.

## Installation

1. Clone the repository:
   ```shell
   git clone https://github.com/v-prt/bookish-backend.git
   ```
2. Navigate to the project directory:
   ```shell
   cd bookish-backend
   ```
3. Install dependencies:
   ```shell
   npm install
   ```

## Configuration

1. Create a `.env` file in the root directory of the project.
2. Set the following environment variables in the `.env` file:

   ```plaintext
   MONGO_URI=<your-mongodb-uri>
   TOKEN_SECRET=<your-generated-key>
   PORT=<your-server-port>
   ```

   Replace `<your-mongodb-uri>` with your MongoDB connection URI, `<your-generated-key>` with the generated token secret, and `<your-server-port>` with your desired port number for the server. See below for more details on getting your own MongoDB URI and token secret.

   Make sure to keep sensitive information secure and avoid sharing them publicly or committing them to version control.

### MongoDB URI

The `MONGO_URI` environment variable specifies the connection URI for your MongoDB database. Follow the steps below to obtain your MongoDB URI:

1. Create a MongoDB Atlas account or access your existing account.
2. Create a new project or select an existing project.
3. Navigate to the "Clusters" section and click on "Connect" for your desired cluster.
4. Choose "Connect your application" as the connection method.
5. Select the appropriate driver (e.g., Node.js) and version.
6. Copy the provided connection string (the MongoDB URI).

   Example MongoDB URI format:
   ```
   mongodb+srv://<username>:<password>@<cluster-address>/<database-name>?retryWrites=true&w=majority
   ```

7. Replace `<username>`, `<password>`, `<cluster-address>`, and `<database-name>` with your actual credentials and database information.

8. Set the `MONGO_URI` environment variable in your development environment or deployment platform to the obtained MongoDB URI.

   - For local development, paste the value in the `.env` file as shown above.

   - For deployment, consult your deployment platform's documentation on how to set environment variables. Set the `MONGO_URI` variable to the obtained MongoDB URI value.

9. Save the changes and restart your server for the new configuration to take effect.

### Token Secret

The `TOKEN_SECRET` environment variable is required for signing JWT tokens in order to authenticate users. Follow the steps below to generate a secure key:

1. Open a terminal or command prompt.

2. Run the following command to generate a random key:

   ```shell
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'));"
   ```

   This command generates a random 64-byte (512-bit) secret key and outputs it as a hexadecimal string.

3. Copy the generated key.

4. Set the `TOKEN_SECRET` environment variable in your development environment or deployment platform.

   - For local development, paste the generated token secret in the `.env` file as shown above.

   - For deployment, consult your deployment platform's documentation on how to set environment variables. Set the `TOKEN_SECRET` variable to the generated token secret value.

5. Save the changes and restart your server for the new configuration to take effect.

Now the necessary environment variables are properly set, allowing your backend to connect to MongoDB, sign/verify JWT tokens securely, and listen on the specified port.

## Usage

1. Start the server:
   ```shell
   npm run start:dev
   ```

## Client Setup

The client for Bookish is available in the [bookish-frontend](https://github.com/v-prt/bookish-frontend) repository. Once you have your backend running, you may set up and run the frontend application.

## Contributing

Contributions are welcome! If you would like to contribute to the Bookish backend, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature/bug fix.
3. Commit your changes.
4. Push the branch to your forked repository.
5. Open a pull request with a detailed description of your changes.

Please ensure that your code adheres to the existing code style and includes appropriate tests.

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


## Acknowledgments

- [TypeScript](https://www.typescriptlang.org/)
- [MongoDB](https://www.mongodb.com/)
- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)
- [Google Books API](https://developers.google.com/books)
