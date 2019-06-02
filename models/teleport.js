const mongoose = require('mongoose');
const mongooseRandom = require('mongoose-simple-random');


const Teleports = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  positionX: { type: Number, required: true },
  positionY: { type: Number, required: true },
  map: { type: Number, required: true }
});

Teleports.plugin(mongooseRandom);

module.exports = mongoose.model('Teleport', Teleports);
