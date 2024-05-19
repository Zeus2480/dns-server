const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  type: { type: String, required: true },
  value: { type: String, required: true },
});

const Record = mongoose.model('Record', recordSchema);

module.exports = Record;
