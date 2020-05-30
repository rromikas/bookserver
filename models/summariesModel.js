const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const SummariesSchema = new Schema({
  date: {type: Number},
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  private: { type: Boolean, default: false },
  summary: { type: String },
  rating: {type: Number, default: 0},
  timesEvaluated: {type: Number, default: 0}
});

const Summary = mongoose.model("Summary", SummariesSchema);

module.exports = Summary;