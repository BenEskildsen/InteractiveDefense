// @flow

const {
  getTileSprite,
} = require('../selectors/sprites');
const {makeEntity} = require('./makeEntity');

const config = {
  TILED: true,
  MELTABLE: true,
  COLLECTABLE: true,
  PHEROMONE_EMITTER: true,
  pheromoneType: 'COLD',
  meltType: 'WATER',
  hp: 120,
  meltTemp: 12, // temperature at which you melt
  heatQuantity: 120, // amount of water produced when melted
  refreshRate: 60,
};

const make = (
  game: Game,
  position: Vector,
	width: ?number,
	height: ?number,
  hp: ?number,
): Ice => {
	return {
    ...makeEntity('ICE', position, width || 1, height || 1),
    ...config,
    hp: hp || config.hp,
    dictIndexStr: '',
    playerID: 0, // gaia
    quantity: 120, // amount of pheromone emitted
  };
};

const render = (ctx, game, ice): void => {
  const obj = getTileSprite(game, ice);
  if (obj == null || obj.img == null) return;
  ctx.drawImage(
    obj.img,
    obj.x, obj.y, obj.width, obj.height,
    ice.position.x, ice.position.y, ice.width, ice.height,
  );
}

module.exports = {
  make, render, config,
};
