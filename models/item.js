const mongoose = require('mongoose')
const mongooseRandom = require('mongoose-simple-random')
const NpcSchema = require('./npc')

const ItemSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  class: { type: Number},
  subclass: { type: Number},
  inventoryType: { type: Number},
  allowableClass: { type: Number},
  droppedBy: { by: NpcSchema },
})

ItemSchema.plugin(mongooseRandom)

module.exports = mongoose.model('Item', ItemSchema)
