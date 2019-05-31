const mongoose = require('mongoose');
const mongooseRandom = require('mongoose-simple-random');


const NpcSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  subname: { type: String },
  tribe: { type: Number },
  class: { type: Number},
  rank: { type: Number },
  skinningId: { type: Number }
});

NpcSchema.plugin(mongooseRandom);

module.exports = mongoose.model('Npc', NpcSchema);
