const mongoose = require('mongoose');
const mongooseRandom = require('mongoose-simple-random');

const Talents = new mongoose.Schema({
  name: { type: String, required: true },
  subname: { type: String, required: true },
  description: { type: String, required: true },
  class: { type: Number },
  specialization: { type: String },
  school: { type: String },
  url: { type: String },
  imageUrl: { type: String },
});

Talents.plugin(mongooseRandom);

module.exports = mongoose.model('Talent', Talents);
