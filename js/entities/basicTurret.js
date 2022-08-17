// @flow

const {makeEntity}= require('./makeEntity.js');
const {add, subtract, equals, makeVector, vectorTheta} = require('../utils/vectors');
const {renderAgent} = require('../render/renderAgent');

const config = {
  TOWER: true,
  hp: 30,
  width: 1,
  height: 1,
  damage: 10,
  maxThetaSpeed: 0.04,

  isExplosionImmune: true,

  // action overrides
  DIE: {
    duration: 2,
    spriteOrder: [0],
  },
  SHOOT: {
    duration: 1000,
    spriteOrder: [0],
  },

  // cost: 50,
  name: 'Turret',

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
    ...makeEntity('TURRET', position, config.width, config.height),
    ...configCopy,
    playerID,

    name: name != null ? name : 'Basic Turret',

    // angle of the turret
    theta: theta != null ? theta : 0,
    thetaSpeed: 0,
    thetaAccel: 0,

    // what the tower wants to aim at
    targetID: null,

    projectileType: projectileType != null ? projectileType : 'BULLET',

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
  ctx.save();
  ctx.fillStyle = "black";
  const turretWidth = 1.5;
  const turretHeight = 0.3;
  ctx.translate(width / 2, height / 2);
  ctx.rotate(theta);
  ctx.translate(-1 * turretWidth * 0.75, -turretHeight / 2);
  ctx.fillRect(0, 0, turretWidth, turretHeight);
  ctx.restore();

  // base of turret
  ctx.strokeStyle = "black";
  ctx.fillStyle = "steelblue";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeRect(0, 0, width, height);


  ctx.restore();
  // const img = game.sprites.BASIC_TURRET;
  // ctx.save();
  // ctx.translate(
  //   position.x, position.y,
  // );

  // // barrel of turret
  // ctx.save();
  // const turretWidth = 1;
  // const turretHeight = 1;
  // ctx.translate(width / 2, height / 2);
  // ctx.rotate(theta);
  // ctx.translate(-1 * turretWidth * 0.75, -turretHeight / 2);
  // ctx.drawImage(img,
  //   16, 0, 16, 16,
  //   0, 0, turretWidth, turretHeight,
  // );


  // ctx.restore();

  // // base of turret
  // ctx.drawImage(img,
  //   0, 0, 16, 16,
  //   0, 0, width, height,
  // );

  // ctx.restore();
};


module.exports = {
  make, render, config,
};
