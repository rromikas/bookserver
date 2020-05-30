const User = require("../models/usersModel");
const Books = require("../models/booksModel");
const Summary = require("../models/summariesModel");
const rp = require("request-promise");

module.exports.GetFilteredBooks = filters => {
  return new Promise(async (resolve, reject) => {
    try {
      const foundBooks = await Books.find().and([
        { $or: filters.genres },
        { $or: filters.authors },
        { $or: filters.publishers }
      ]);
      if (foundBooks) {
        resolve({ foundBooks });
      } else resolve({ error: true });
    } catch (er) {
      resolve({ error: true });
    }
  });
};

module.exports.GetAllBooks = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const allBooks = await Books.find({});
      if (allBooks) {
        resolve({ allBooks });
      } else resolve({ error: "No books in library" });
    } catch (err) {
      resolve({ error: "syntax error" });
    }
  });
};

module.exports.GetRecentlyAddedBooks = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const recentlyAddedBooks = await Books.find({})
        .sort({ dateAdded: "desc" })
        .limit(20)
        .exec();
      if (recentlyAddedBooks) {
        resolve({ recentlyAddedBooks });
      } else resolve({ error: "No books in library" });
    } catch (err) {
      resolve({ error: "syntax error" });
    }
  });
};

module.exports.GetBooks = query => {
  return new Promise((resolve, reject) => {
    const options = {
      uri: process.env.BOOKSURI,
      qs: {
        key: process.env.BOOKSAPI,
        q: query.isbn ? `isbn:${query.isbn}` : query.title
      },
      headers: {
        "User-Agent": "Request-Promise"
      },
      json: true
    };
    rp(options)
      .then(function(repos) {
        if (repos.error || repos.totalItems === 0) {
          resolve({ found: false, books: [] });
        } else {
          resolve({ found: true, books: repos.items });
        }
      })
      .catch(function(err) {
        resolve({ found: false, books: [] });
      });
  });
};

module.exports.GetBook = bookFilter => {
  return new Promise(async (resolve, reject) => {
    try {
      const filteredBooks = await Books.find(bookFilter)
        .populate("threads.createdBy")
        .exec();
      if (filteredBooks) {
        resolve({ filteredBooks });
      } else resolve({ error: "No such book" });
    } catch (err) {
      resolve({ error: "Syntax error" });
    }
  });
};

module.exports.AddBook = book => {
  return new Promise(async (resolve, reject) => {
    try {
      const savedBook = await Books.findOneAndUpdate(book, book, {
        upsert: true,
        new: true
      });
      if (savedBook) {
        resolve({ success: true, savedBook });
      } else resolve({ error: "Failed to add book" });
    } catch (err) {
      resolve({ error: "syntax error" });
    }
  });
};

module.exports.SearchBooks = query => {
  return new Promise(async (resolve, reject) => {
    try {
      const foundBooks = await Books.find().or([
        { title: { $regex: query, $options: "i" } },
        { isbn10: query },
        { isbn13: query },
        { authors: { $regex: query, $options: "i" } },
        { genre: { $regex: query, $options: "i" } }
      ]);
      if (foundBooks) {
        resolve({ foundBooks });
      } else resolve({ error: "No such books" });
    } catch (er) {
      resolve({ error: "Syntax error" });
    }
  });
};

module.exports.CreateThread = ({ bookId, userId, title, description }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const createdThread = await Books.findOneAndUpdate(
        { _id: bookId },
        {
          $push: {
            threads: {
              createdBy: userId,
              title: title,
              date: Date.now(),
              description: description
            }
          }
        }
      );
      if (createdThread) {
        resolve({ createdThread });
      } else resolve({ error: "Couldn't create thread" });
    } catch (er) {
      resolve({ error: "Syntax error" });
    }
  });
};

module.exports.GetLatestThreads = ({ bookId, limit }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = await Books.findOne({ _id: bookId })
        .populate("threads.createdBy")
        .select("threads");
      if (doc.threads) {
        let threads = doc.threads.slice(0);
        threads.sort((a, b) =>
          a["date"] > b["date"] ? -1 : a["date"] < b["date"] ? 1 : 0
        );
        threads = threads.slice(0, limit);
        resolve({ threads });
      } else {
        resolve({ error: "No such threads" });
      }
    } catch (er) {
      resolve({ error: "Syntax error" });
    }
  });
};
module.exports.GetUnansweredThreads = ({ bookId, limit }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = await Books.findOne({ _id: bookId })
        .populate("threads.createdBy")
        .select("threads");
      if (doc.threads) {
        let threads = doc.threads.slice(0);
        threads.sort((a, b) =>
          a["replies"].length > b["replies"].length
            ? 1
            : a["replies"].length < b["replies"].length
            ? -1
            : 0
        );
        threads = threads.slice(0, limit);
        resolve({ threads });
      } else {
        resolve({ error: "No such threads" });
      }
    } catch (er) {
      resolve({ error: "Syntax error" });
    }
  });
};

module.exports.GetTopThreads = ({ bookId, limit }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const proportion = 2; // reply is worth two times as view
      const doc = await Books.findOne({ _id: bookId })
        .populate("threads.createdBy")
        .select("threads");
      if (doc.threads) {
        let threads = doc.threads.slice(0);
        threads.sort((a, b) =>
          a["replies"].length * proportion + a["views"] >
          b["replies"].length * proportion + b["views"]
            ? -1
            : a["replies"].length * proportion + a["views"] <
              b["replies"].length * proportion + b["views"]
            ? 1
            : 0
        );
        threads = threads.slice(0, limit);
        resolve({ threads });
      } else {
        resolve({ error: "No such threads" });
      }
    } catch (er) {
      resolve({ error: "Syntax error" });
    }
  });
};

module.exports.AddView = ({ bookId, threadId }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updatedValue = await Books.findOneAndUpdate(
        { _id: bookId, "threads._id": threadId },
        {
          $inc: { "threads.$.views": 1 }
        }
      ).exec();
      if (updatedValue) {
        resolve({ updatedValue });
      } else resolve({ error: "Couldn't add view" });
    } catch (er) {
      resolve({ error: "Syntax error" });
    }
  });
};

module.exports.ReplyToQuestion = ({ reply, bookId, userId, threadId }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const insertedReply = await Books.updateOne(
        { _id: bookId, "threads._id": threadId },
        {
          $addToSet: {
            "threads.$.replies": {
              reply: reply,
              repliedBy: userId,
              date: Date.now()
            }
          }
        }
      );
      if (insertedReply) {
        resolve({ insertedReply });
      } else resolve({ error: "Couldn't reply to question" });
    } catch (er) {
      resolve({ error: "Syntax error" });
    }
  });
};

module.exports.GetThread = ({ bookId, threadId }) => {
  return new Promise(async (resolve, reject) => {
    let filter = {};
    filter["_id"] = bookId;
    filter["threads._id"] = threadId;
    try {
      const threads = await Books.findOne(filter, {
        "threads.$": 1
      })
        .populate("threads.replies.repliedBy")
        .populate("threads.createdBy")
        .exec();
      if (threads.threads[0]) {
        resolve({ success: true, thread: threads.threads[0] });
      } else resolve({ error: true });
    } catch (er) {
      resolve({ error: true });
    }
  });
};

module.exports.AddBookToFavorites = ({ bookId, userId }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let updatedBook;
      const updatedUser = await User.findOneAndUpdate(
        { _id: userId, "favoriteBooks.book": { $ne: bookId } },
        {
          $push: {
            favoriteBooks: {
              book: bookId
            }
          }
        }
      );

      if (updatedUser) {
        updatedBook = await Books.findOneAndUpdate(
          { _id: bookId },
          {
            $inc: { favorite: 1 }
          }
        );
      }

      console.log("updaetd user", updatedUser);
      if (updatedBook && updatedUser) {
        resolve({ updatedUser, updatedBook });
      } else {
        resolve({ error: "Couldn't  add to favorite" });
      }
    } catch (er) {
      resolve({ error: "Syntax error" });
    }
  });
};



