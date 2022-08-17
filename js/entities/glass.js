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
  pheromoneType: 'MOLTEN_SAND',
  hp: 10,
  meltTemp: 100, // temperature at which you catch on fire
  heatQuantity: 120, // amount of glass produced when melted
};

const make = (
  game: Game,
  position: Vector,
	width: ?number,
	height: ?number,
  hp: ?number,
): Steel => {
	return {
    ...makeEntity('GLASS', position, width || 1, height || 1),
    ...config,
    dictIndexStr: '',
    hp: hp || config.hp,
    playerID: 0, // gaia
    quantity: 0, // amount of pheromone emitted
  };
};

const render = (ctx, game, glass): void => {
  const obj = getTileSprite(game, glass);
  if (obj == null || obj.img == null) return;
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.drawImage(
    obj.img,
    obj.x, obj.y, obj.width, obj.height,
    glass.position.x, glass.position.y, glass.width, glass.height,
  );
  ctx.restore();
}

module.exports = {
  make, render, config,
};
