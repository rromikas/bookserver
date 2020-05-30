const User = require("../models/usersModel");
const Books = require("../models/booksModel");
const Summary = require("../models/summariesModel");

module.exports.AddSummary = ({bookId, summary}) => {
  console.log("bookId, summary in addSumarry api 330", bookId, summary)
  return new Promise(async (resolve, reject) => {
    try{
      let newSummary = new Summary({
          summary: summary.summary,
          private: summary.private,
          date: Date.now(),
          author: summary.authorId
        });
      newSummary.save();
      console.log("NEW SUMMARY ID", newSummary._id);
      const updatedBook = await Books.findOneAndUpdate(
        { _id: bookId },
        {
          $push: {
            summaries: {
              summary: newSummary._id
            }
          }
        }
      );
      resolve({updatedBook});
    }
    catch(er){
      console.log("ERORAS", er)
      resolve({ error: "Syntax error" });
    }
  })
}

module.exports.GetTopRatedSummaries = ({ bookId, limit }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const proportion = 2; // reply is worth two times as view
      const doc = await Books.findOne({ _id: bookId })
        .populate({
          path: "summary",
          populate: {
            path: "author"
          }
        })
        .select("summaries");
      console.log(doc.summaries);
      if (doc.summaries) {
        let summaries = doc.summaries.slice(0);
        summaries.sort((a, b) =>
          a["rating"] >
          b["rating"]
            ? -1
            : a["rating"] <
              b["rating"]
            ? 1
            : 0
        );
        summaries = summaries.slice(0, limit);
        resolve({ summaries });
      } else {
        resolve({ error: "No such summaries" });
      }
    } catch (er) {
      resolve({ error: "Syntax error" });
    }
  });
};
