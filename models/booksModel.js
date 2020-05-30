const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const BooksSchema = new Schema({
  dateAdded: {
    type: Number
  },
  title: {
    type: String,
  },
  authors: {
    type: String,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  genre: {
    type: String,
  },
  isbn10: {
    type: String,
  },
  isbn13: {
    type: String,
  },
  language: {
    type: String,
  },
  publishedDate: {
    type: String,
  },
  publisher: {
    type: String,
  },
  subtitle: {
    type: String,
  },

  favorite: { type: Number, default: 0 },

  summaries: [{ summary: { type: mongoose.Schema.Types.ObjectId, ref: "Summary" } }],
  
  threads: [
    {
      date: Number,
      title: String,
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      views: { type: Number, default: 0 },
      description: {
        type: String,
        default: "No description provided",
      },
      replies: [
        {
          date: Number,
          reply: String,
          repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
      ],
    },
  ],
});

const Books = model("books", BooksSchema);


module.exports = Books;