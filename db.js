import mongoose from 'mongoose'

const DATABASE_URI = process.env.MONGODB_URI || 'mongodb://localhost/wowdb'

export const connect = () => new Promise((resolve, reject) => {
  mongoose.connect(DATABASE_URI, async (err) => {
    if (err) {
      reject(err)
    }
    console.log('Connected to database!')
    resolve()
  })
})

export const findOneRandom = (model, query) => new Promise((resolve, reject) => {
  console.info(`Querying one from ${model.collection.name}`,JSON.stringify(query))
  model.findOneRandom(query, async function(err, result) { // does't work with promises :(
    if (err) {
      reject(err)
      return
    }
    resolve(result)
  })
})


export const findRandom = (model, query, limit) => new Promise((resolve, reject) => {
  console.info(`Querying up to ${limit} from ${model.collection.name}`,JSON.stringify(query))
  model.findRandom(query, {}, { limit }, function(err, results) { // does't work with promises :(
    if (err) {
      reject(err)
      return;
    }
    resolve(results)
  })
})
