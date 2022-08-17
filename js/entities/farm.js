// @flow

const {makeEntity}= require('./makeEntity.js');
const {add, subtract, equals, makeVector, vectorTheta} = require('../utils/vectors');
const {renderAgent} = require('../render/renderAgent');

const config = {
  hp: 10,
  width: 2,
  height: 2,
  maxThetaSpeed: 0.05,
  // cost: 100,
  isExplosionImmune: true,
  name: 'Farm',
};

const make = (
  game: Game,
  position: Vector,
  playerID: PlayerID,
): Tower => {
  return {
    ...makeEntity('FARM', position, config.width, config.height),
    ...config,
    playerID,

    // angle of the turbine
    theta: 0,
    thetaSpeed: 0,

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
