export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

export const flatten = list => list.reduce(
  (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
);

export const selectRandom = list => list[Math.floor(Math.random() * list.length)]
export const randomIndex = list => Math.floor(Math.random() * list.length)

export const formatOptions = (options, optionsTexts) => {
  const texts = ['']
  options.forEach((option, index) => {
    texts.push(` ${option} for **${optionsTexts[index]}**`)
  })
  return texts.join('\n')
}

export const embedColor = '#2b9752'
