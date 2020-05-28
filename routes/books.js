const express = require("express");
const rp = require("request-promise");
const router = express.Router();
const mongoose = require("mongoose");
require("../models/booksModel");
const Books = mongoose.model("books");
const Users = require("../models/usersModel");

router.get("/getBooks", function (req, res, next) {
  const options = {
    uri: process.env.BOOKSURI,
    qs: {
      key: process.env.BOOKSAPI,
      q: req.query.isbn ? `isbn:${req.query.isbn}` : req.query.title,
    },
    headers: {
      "User-Agent": "Request-Promise",
    },
    json: true,
  };
  rp(options)
    .then(function (repos) {
      if (repos.error || repos.totalItems === 0) {
        res.status(400).json({ found: false, books: [] });
      } else {
        res.status(200).json({ found: true, books: repos.items });
      }
    })
    .catch(function (err) {
      console.log("eroras 404: ", err);
      res.status(404).json({ found: false, books: [] });
    });
});

router.post("/saveBook", async (req, res, next) => {
  try {
    const savedBook = await Books.findOneAndUpdate(req.body, req.body, {
      upsert: true,
      new: true,
    });
    if (savedBook) {
      res.status(200).json({ success: true, savedBook });
    } else res.status(500).json({ error: true });
  } catch (err) {
    res.status(500).json({ error: true });
  }
});

router.get("/getAllBooks", async (req, res, next) => {
  try {
    const allBooks = await Books.find({});
    if (allBooks) {
      res.status(200).json({ success: true, allBooks });
    } else res.status(500).json({ error: true });
  } catch (err) {
    res.status(500).json({ error: true });
  }
});

router.post("/getBook", async (req, res, next) => {
  try {
    const filteredBooks = await Books.find(req.body)
      .populate("threads.createdBy")
      .exec();
    if (filteredBooks) {
      res.status(200).json({ success: true, filteredBooks });
    } else res.status(500).json({ error: true });
  } catch (err) {
    res.status(500).json({ error: true });
  }
});

router.post("/createThread", async (req, res, next) => {
  let { bookId, userId, title, description } = req.body;
  console.log("USER ID CREATED THREAD", userId);
  try {
    const createdThread = await Books.findOneAndUpdate(
      { _id: bookId },
      {
        $push: {
          threads: {
            createdBy: userId,
            title: title,
            date: Date.now(),
            description: description,
          },
        },
      }
    );
    if (createdThread) {
      res.status(200).json({ success: true, createdThread });
    } else res.status(500).json({ error: true });
  } catch (er) {
    console.log("eroras mano", er);
    res.status(500).json({ error: true });
  }
});

router.post("/getThread", async (req, res, next) => {
  let { bookId, threadId } = req.body;
  let filter = {};
  filter["_id"] = bookId;
  filter["threads._id"] = threadId;
  try {
    const threads = await Books.findOne(filter, {
      "threads.$": 1,
    })
      .populate("threads.replies.repliedBy")
      .populate("threads.createdBy")
      .exec();
    if (threads.threads[0]) {
      res.status(200).json({ success: true, thread: threads.threads[0] });
    } else res.status(500).json({ error: true });
  } catch (er) {
    res.status(500).json({ error: true });
  }
});

router.post("/replyToQuestion", async (req, res, next) => {
  let { reply, bookId, userId, threadId } = req.body;

  try {
    const insertedReply = await Books.updateOne(
      { _id: bookId, "threads._id": threadId },
      {
        $addToSet: {
          "threads.$.replies": {
            reply: reply,
            repliedBy: userId,
            date: Date.now(),
          },
        },
      }
    );
    if (insertedReply) {
      res.status(200).json({ success: true, insertedReply });
    } else res.status(500).json({ error: true });
  } catch (er) {
    res.status(500).json({ error: true });
  }
});

router.post("/search", async (req, res, next) => {
  let { query } = req.body;
  try {
    const foundBooks = await Books.find().or([
      { title: { $regex: query, $options: "i" } },
      { isbn10: query },
      { isbn13: query },
      { authors: { $regex: query, $options: "i" } },
      { genre: { $regex: query, $options: "i" } },
    ]);
    if (foundBooks) {
      res.status(200).json({ success: true, foundBooks });
    } else res.status(500).json({ error: true });
  } catch (er) {
    res.status(500).json({ error: true });
  }
});
router.post("/filter", async (req, res, next) => {
  let { filters } = req.body;
  try {
    const foundBooks = await Books.find().and([
      { $or: filters.genres },
      { $or: filters.authors },
      { $or: filters.publishers },
    ]);
    if (foundBooks) {
      res.status(200).json({ success: true, foundBooks });
    } else res.status(500).json({ error: true });
  } catch (er) {
    res.status(500).json({ error: true });
  }
});

router.post("/addView", async (req, res, next) => {
  const { bookId, threadId } = req.body;
  try {
    const updatedValue = await Books.findOneAndUpdate(
      { _id: bookId, "threads._id": threadId },
      {
        $inc: { "threads.$.views": 1 },
      }
    ).exec();
    if (updatedValue) {
      res.status(200).json({ success: true, updatedValue });
    } else res.status(500).json({ error: true });
  } catch (er) {
    res.status(500).json({ error: true });
  }
});

router.post("/getLatestThreads", async (req, res, next) => {
  const { bookId, limit } = req.body;
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
      res.status(200).json({ success: true, threads });
    } else {
      res.status(500).json({ error: true });
    }
  } catch (er) {
    console.log("errror thread leatest", er);
    res.status(500).json({ error: true });
  }
});

router.post("/getUnansweredThreads", async (req, res, next) => {
  const { bookId, limit } = req.body;
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
      res.status(200).json({ success: true, threads });
    } else {
      res.status(500).json({ error: true });
    }
  } catch (er) {
    res.status(500).json({ error: true });
  }
});

router.post("/getTopThreads", async (req, res, next) => {
  const { bookId, limit } = req.body;
  const proportion = 2; // reply is worth two times as view
  try {
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
      res.status(200).json({ success: true, threads });
    } else {
      res.status(500).json({ error: true });
    }
  } catch (er) {
    res.status(500).json({ error: true });
  }
});

router.post("/addToFavorites", async (req, res, next) => {
  console.log("add to favorties got request", req.body);
  const { bookId, userId } = req.body;
  try {
    let updatedBook;
    const updatedUser = await Users.findOneAndUpdate(
      { _id: userId, "favoriteBooks.book": { $ne: bookId } },
      {
        $push: {
          favoriteBooks: {
            book: bookId,
          },
        },
      }
    );

    if (updatedUser) {
      updatedBook = await Books.findOneAndUpdate(
        { _id: bookId },
        {
          $inc: { favorite: 1 },
        }
      );
    }

    console.log("updaetd user", updatedUser);
    if (updatedBook && updatedUser) {
      res.status(200).json({ success: true, updatedUser, updatedUser });
    } else {
      res.status(200).json({ error: true });
    }
  } catch (er) {
    res.status(500).json({ error: true });
  }
});
module.exports = router;
