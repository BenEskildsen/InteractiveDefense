// @flow

const {Entities} = require('../entities/registry');

const getModifiedCost = (game: Game, entityType: EntityType): Object => {
  const cost = Entities[entityType].config.cost;
  if (entityType != "FARM") return cost;

  const numBuilding = game[entityType]
    .map(id => game.entities[id])
    .filter(e => e.playerID == game.playerID)
    .length;
  return cost * numBuilding + cost;
}

const canAffordBuilding = (game, cost: Cost): Boolean => {
  return game.money >= cost;
};

module.exports = {
  canAffordBuilding,
  getModifiedCost,
};
