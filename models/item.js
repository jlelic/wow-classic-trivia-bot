const mongoose = require('mongoose')
const mongooseRandom = require('mongoose-simple-random')
const Schema = mongoose.Schema;
const NpcSchema = require('./npc')

const ItemSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  class: { type: Number },
  subclass: { type: Number },
  inventoryType: { type: Number },
  allowableClass: { type: Number },
  droppedBy: { type: Number },
})

ItemSchema.plugin(mongooseRandom)

module.exports = mongoose.model('Item', ItemSchema)
