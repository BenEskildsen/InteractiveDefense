// @flow

const {makeEntity}= require('./makeEntity.js');
const {add, subtract, equals, makeVector, vectorTheta} = require('../utils/vectors');
const {renderAgent} = require('../render/renderAgent');

const config = {
  TOWER: true,
  // POWER_CONSUMER: true,
  // powerConsumed: 1,
  hp: 120,
  width: 2,
  height: 2,
  damage: 40,
  thetaAccel: 0.00005,
  minTheta: 0.2,
  maxTheta: Math.PI - 0.2,
  maxThetaSpeed: 0.04,

  isExplosionImmune: true,

  // action overrides
  DIE: {
    duration: 2,
    spriteOrder: [0],
  },
  SHOOT: {
    duration: 4000,
    spriteOrder: [0],
  },

  // cost: 50,

};

const make = (
  game: Game,
  position: Vector,
  playerID: PlayerID,
  projectileType: ?EntityType,
  fireRate: ?number,
  name: ?String,
  theta: ?number,
): Tower => {
  const configCopy = {...config};
  if (fireRate != null) {
    configCopy.SHOOT = {
      ...configCopy.SHOOT,
      duration: fireRate,
    }
  }
  return {
    ...makeEntity('SPLASH_TURRET', position, config.width, config.height),
    ...configCopy,
    playerID,

    // power:
    isPowered: false,
    name: name != null ? name : 'Explosive Turret',

    // angle of the turret
    theta: theta != null ? theta : config.minTheta,
    thetaSpeed: 0,
    thetaAccel: 0,

    // what the tower wants to aim at
    targetID: null,

    projectileType: projectileType != null ? projectileType : 'DYNAMITE',

    actions: [],


  };
};

const render = (ctx, game, turret): void => {
  const {position, width, height, theta} = turret;
  ctx.save();
  ctx.translate(
    position.x, position.y,
  );

  // barrel of turret
  // ctx.save();
  // ctx.fillStyle = "black";
  // const turretWidth = 3;
  // const turretHeight = 0.3;
  // ctx.translate(width / 2, height / 2);
  // ctx.rotate(theta);
  // ctx.translate(-1 * turretWidth * 0.75, -turretHeight / 2);
  // ctx.fillRect(0, 0, turretWidth, turretHeight);
  // ctx.restore();

  // base of turret
  ctx.strokeStyle = "black";
  ctx.fillStyle = "steelblue";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeRect(0, 0, width, height);


  ctx.restore();
};


module.exports = {
  make, render, config,
};
