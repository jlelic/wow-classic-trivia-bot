export const tribes = {
  1: 'Beast',
  2: 'Dragonkin',
  3: 'Demon',
  4: 'Elemental',
  5: 'Giant',
  6: 'Undead',
  7: 'Humanoid',
  8: 'Critter',
  9: 'Mechanical',
  10: 'Unspecified',
  12: 'Totem',
}

export const ranks = {
  0: 'Normal',
  1: 'Rare',
  2: 'Elite',
  3: 'Rare Elite',
  4: 'Boss',
}

export const classToFilter = [1, 2, 3, 7, 11, 4, 8, 9, 5]

export const reqClassToName = {
  1: 'Warrior',
  2: 'Paladin',
  4: 'Hunter',
  8: 'Rogue',
  16: 'Priest',
  64: 'Shaman',
  128: 'Mage',
  256: 'Warlock',
  1024: 'Druid',
}

export const maps = ['Eastern Kingdoms', 'Kalimdor']

export const classMapToDb = [1, 2, 4, 64, 1024, 8, 128, 256, 16]
export const classMapToId = {}
classMapToDb.forEach((db, i) => classMapToId[db] = i)
export const classes = [
  'Warrior',
  'Paladin',
  'Hunter',
  'Shaman',
  'Druid',
  'Rogue',
  'Mage',
  'Warlock',
  'Priest'
]

export const talentPercentages = [
  [1, 2, 3, 4, 5, 6, 7, 8, 10, 14, 15, 16, 20, 25, 30, 33, 35, 40, 45, 50, 100],
  [2, 4, 6, 7, 8, 10, 12, 13, 14, 15, 16, 20, 25, 28, 30, 33, 40, 50, 60, 66, 70, 80, 100],
  [3, 6, 9, 10, 12, 15, 18, 20, 21, 24, 25, 30, 35, 42, 45, 50, 60, 65, 75, 100, 120],
  [4, 8, 12, 16, 20, 24, 25, 28, 32, 40, 56, 65, 80],
  [5, 6, 10, 15, 20, 25, 30, 35, 40, 50, 70, 100]
]
