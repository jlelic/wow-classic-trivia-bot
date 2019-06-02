const mongoose = require('mongoose');
const mongooseRandom = require('mongoose-simple-random');


const Factions = new mongoose.Schema({
  name: { type: String, required: true },
  descriptionCensored: { type: String },
  url: { type: String },
});

Factions.plugin(mongooseRandom);

module.exports = mongoose.model('Faction', Factions);
