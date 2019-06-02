const mongoose = require('mongoose');
const mongooseRandom = require('mongoose-simple-random');


const Abilities = new mongoose.Schema({
  name: { type: String, required: true },
  subname: { type: String, required: true },
  description: { type: String, required: true },
  level: { type: Number },
  class: { type: Number },
  school: { type: String },
  cost: { type: Number },
  resource: { type: Number },
  range: { type: Number },
  castTime: { type: Number },
  isChannelled: { type: Boolean },
  url: { type: String },
  imageUrl: { type: String },
});

Abilities.plugin(mongooseRandom);

module.exports = mongoose.model('Ability', Abilities, 'abilities');
