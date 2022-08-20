// @flow

const {makeEntity}= require('./makeEntity.js');
const {add, subtract, equals, makeVector, vectorTheta} = require('../utils/vectors');
const {renderAgent} = require('../render/renderAgent');
const {getSpiderSprite} = require('../selectors/sprites');

const config = {
  hp: 100,
  maxHP: 100,
  damage: 1,
  width: 4,
  height: 4,
  maxThetaSpeed: 0.05,
  // cost: 100,
  name: 'Upgrade',
  AGENT: true,

  upgradeTypes: [
    'FIRE_RATE', 'TURN_RATE', // 'TRIPLE_SHOT',
    'DAMAGE', 'MONEY',
    'MISSILE_EXPLOSION',
  ],

  blockingTypes: [
    'FOOD', 'DIRT', 'AGENT',
    'TURRET', 'MONSTER', 'FARM',
    'SPLASH_TURRET',
    'STEEL', 'BASE',
  ],

  MOVE: {
    duration: 41 * 10,
    spriteOrder: [1, 2, 3, 4, 5],
    maxFrameOffset: 2,
    frameStep: 2,
  },
  TURN: {
    duration: 41 * 15,
    spriteOrder: [1, 2, 3, 4, 5],
  },
  MOVE_TURN: {
    duration: 41 * 22,
    spriteOrder: [1, 2, 3, 4, 5, 1,2,3,4,5],
  },
  BITE: {
    duration: 41 * 6,
    spriteOrder: [6, 7],
  },
  DIE: {
    duration: 41 * 2,
    spriteOrder: [6],
  },

  WANDER: {
    base: 1,
    forwardMovementBonus: 0,
    prevPositionPenalty: -100,
    FOLLOW: 2,
    COLONY: 2,
    PASS_THROUGH_COLONY: 2,
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

    task: 'WANDER',

    upgradeType,
    timeOnMove: 0, // for turning in place

  };
};

const render = (ctx, game: Game, agent: Agent): void => {
  renderAgent(ctx, game, agent, spriteRenderFn);
}

const spriteRenderFn = (ctx, game, ant) => {
  const sprite = getSpiderSprite(game, ant);
  if (sprite.img != null) {
    ctx.drawImage(
      sprite.img, sprite.x, sprite.y, sprite.width, sprite.height,
      0, 0, ant.width, ant.height,
    );
  }
}

// const render = (ctx, game, turret): void => {
//   const {position, width, height, theta} = turret;
//   ctx.save();
//   ctx.translate(
//     position.x, position.y,
//   );
//
//   // base of turbine
//   ctx.strokeStyle = "black";
//   ctx.fillStyle = "steelblue";
//   ctx.globalAlpha = 0.1;
//   ctx.fillRect(0, 0, width, height);
//   ctx.strokeRect(0, 0, width, height);
//   ctx.globalAlpha = 1;
//
//   // blades of the turbine
//   for (let i = 0; i < 4; i++) {
//     ctx.save();
//     ctx.fillStyle = "#8B0000";
//     const turbineWidth = 1.5;
//     const turbineHeight = 0.3;
//     ctx.translate(width / 2, height / 2);
//     ctx.rotate(theta + (i * Math.PI / 2));
//     ctx.translate(-1 * turbineWidth * 0.75, -turbineHeight / 2);
//     ctx.fillRect(0, 0, turbineWidth, turbineHeight);
//     ctx.restore();
//   }
//
//   ctx.restore();
// };


module.exports = {
  make, render, config,
};
