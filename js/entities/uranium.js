// @flow

const {
  getTileSprite,
} = require('../selectors/sprites');
const {makeEntity} = require('./makeEntity');

const config = {
  TILED: true,
  COLLECTABLE: true,
  PHEROMONE_EMITTER: true,
  pheromoneType: 'HEAT',
  hp: 100,
  heatQuantity: 125, // amount of heat produced when on fire
  refreshRate: 60,
};

const make = (
  game: Game,
  position: Vector,
	width: ?number,
	height: ?number,
): Coal => {
	return {
    ...makeEntity('URANIUM', position, width || 1, height || 1),
    ...config,
    dictIndexStr: '',
    playerID: 0, // gaia
    quantity: config.heatQuantity, // amount of pheromone emitted
  };
};

const render = (ctx, game, uranium): void => {
  const obj = getTileSprite(game, uranium);
  if (obj == null || obj.img == null) return;
  ctx.drawImage(
    obj.img,
    obj.x, obj.y, obj.width, obj.height,
    uranium.position.x, uranium.position.y, uranium.width, uranium.height,
  );
}

module.exports = {
  make, render, config,
};
