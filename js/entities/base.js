// @flow

const {makeEntity} = require('./makeEntity');
const globalConfig = require('../config');
const {renderHealthBar} = require('../render/renderHealthBar');

const config = {
  hp: 500,
  maxHP: 500,
  width: 3,
  height: 3,
  PHEROMONE_EMITTER: true,
  pheromoneType: 'COLONY',
  AGENT: true,
  isExplosionImmune: true,

  maxThetaSpeed: 0.04,
  TOWER: true,
  TARGETED: true,

  blockingTypes: [
    'FOOD', 'DIRT', 'AGENT',
    'STONE', 'DOODAD', 'WORM',
    'TOKEN', 'DYNAMITE',
    'COAL', 'IRON', 'STEEL',
  ],

  // need this for panning to focus on it
  MOVE: {
    duration: 45 * 4,
  },

  SHOOT: {
    duration: 1000,
    spriteOrder: [0],
  },
};

const make = (
  game: Game,
  position: Vector,
  playerID,
  quantity: ?number,
): Base => {
  return {
    ...makeEntity('BASE', position, config.width, config.height),
    ...config,
    playerID,
    quantity: quantity || globalConfig.pheromones[config.pheromoneType].quantity,
    actions: [],

    projectileType: 'BULLET',
    // angle of the turret
    theta: 0,
    thetaSpeed: 0,
    thetaAccel: 0,
  };
};


const render = (ctx, game: Game, base): void => {
  const {position, width, height, theta} = base;
  const img = game.sprites.BASE;
  ctx.save();
  ctx.translate(
    position.x, position.y,
  );
  ctx.drawImage(img, 0, 0, base.width, base.height);

  // barrel of turret
  ctx.save();
  ctx.fillStyle = "black";
  const turretWidth = 3.5;
  const turretHeight = 0.3;
  ctx.translate(width / 2, height / 2);
  ctx.rotate(theta);
  ctx.translate(-1 * turretWidth * 0.75, -turretHeight / 2);
  ctx.fillRect(0, 0, turretWidth, turretHeight);
  ctx.restore();

  // healthbar
  // do the rotation just to undo it in renderHP, since
  // theta for base is just for the turret
	ctx.translate(width / 2, height / 2);
  ctx.rotate(theta);
  ctx.translate(-width / 2, -height / 2);
  renderHealthBar(ctx, base, base.maxHP);

  ctx.restore();
};

module.exports = {config, make, render};
