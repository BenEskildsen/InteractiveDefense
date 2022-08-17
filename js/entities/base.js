// @flow

const {makeEntity} = require('./makeEntity');
const globalConfig = require('../config');

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

const render = (ctx, game, base): void => {
  const img = game.sprites.BASE;
  ctx.drawImage(img, base.position.x, base.position.y, base.width, base.height);


  const {position, width, height, theta} = base;
  ctx.save();
  ctx.translate(
    position.x, position.y,
  );

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

  ctx.restore();
};

module.exports = {config, make, render};
