// @flow

const {makeEntity}= require('./makeEntity.js');
const {add, subtract, equals, makeVector, vectorTheta} = require('../utils/vectors');
const {renderAgent} = require('../render/renderAgent');

const config = {
  hp: 5,
  width: 2,
  height: 2,
  maxThetaSpeed: 0.05,
  // cost: 100,
 name: 'Upgrade',
  AGENT: true,

  upgradeTypes: [
    'FIRE_RATE', 'TURN_RATE', // 'MISSILES', 'TRIPLE_SHOT',
  ],

  blockingTypes: [
    'FOOD', 'DIRT', 'AGENT',
    'TURRET', 'MONSTER', 'FARM',
    'SPLASH_TURRET',
    'STEEL', 'BASE',
  ],

  MOVE: {
    duration: 41 * 6,
    spriteOrder: [1, 2],
    maxFrameOffset: 2,
    frameStep: 2,
  },

  WANDER: {
    base: 1,
    forwardMovementBonus: 0,
    prevPositionPenalty: -100,
    FOLLOW: 2,
    COLONY: 1,
    PASS_THROUGH_COLONY: 1,
  },
};

const make = (
  game: Game,
  position: Vector,
  upgradeType: String,
): Tower => {
  return {
    ...makeEntity('UPGRADE', position, config.width, config.height),
    ...config,

    // angle of the turbine
    theta: 0,
    thetaSpeed: 0,
    actions: [],
    age: 0,

    upgradeType,
    timeOnMove: 0, // for turning in place

  };
};

const render = (ctx, game, turret): void => {
  const {position, width, height, theta} = turret;
  ctx.save();
  ctx.translate(
    position.x, position.y,
  );

  // base of turbine
  ctx.strokeStyle = "black";
  ctx.fillStyle = "steelblue";
  ctx.globalAlpha = 0.1;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeRect(0, 0, width, height);
  ctx.globalAlpha = 1;

  // blades of the turbine
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.fillStyle = "#8B0000";
    const turbineWidth = 1.5;
    const turbineHeight = 0.3;
    ctx.translate(width / 2, height / 2);
    ctx.rotate(theta + (i * Math.PI / 2));
    ctx.translate(-1 * turbineWidth * 0.75, -turbineHeight / 2);
    ctx.fillRect(0, 0, turbineWidth, turbineHeight);
    ctx.restore();
  }

  ctx.restore();
};


module.exports = {
  make, render, config,
};
