// @flow

const {
  getTileSprite,
} = require('../selectors/sprites');
const {makeEntity} = require('./makeEntity');

const config = {
  TILED: true,
  FLAMMABLE: true,
  COLLECTABLE: true,
  PHEROMONE_EMITTER: true,
  pheromoneType: 'HEAT',
  hp: 10,
  combustionTemp: 125, // temperature at which you catch on fire
  fuel: 3 * 60 * 1000, // ms of burn time
  heatQuantity: 150, // amount of heat produced when on fire
  refreshRate: 60, // heat is updated this often
};

const make = (
  game: Game,
  position: Vector,
	width: ?number,
	height: ?number,
): Coal => {
	return {
    ...makeEntity('COAL', position, width || 1, height || 1),
    ...config,
    dictIndexStr: '',
    onFire: false,
    playerID: 0, // gaia
    quantity: 0, // amount of pheromone emitted
  };
};

const render = (ctx, game, coal): void => {
  const obj = getTileSprite(game, coal);
  if (obj == null || obj.img == null) return;
  ctx.drawImage(
    obj.img,
    obj.x, obj.y, obj.width, obj.height,
    coal.position.x, coal.position.y, coal.width, coal.height,
  );
}

module.exports = {
  make, render, config,
};
