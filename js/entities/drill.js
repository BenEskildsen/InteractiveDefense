// @flow

const {makeEntity} = require('./makeEntity');
const {getAntSpriteAndOffset} = require('../selectors/sprites');
const {renderAgent} = require('../render/renderAgent');

const config = {
  hp: 200,
  damage: 1,
  width: 2,
  height: 2,
  age: 0,

  AGENT: true,
  RAM: true, // property where you deal damage to things you collide with
  MANNED: true, // property where you can have a player ride

  blockingTypes: [
    'FOOD', 'DIRT', 'AGENT',
    'STONE', 'DOODAD', 'WORM',
    'TOKEN', 'DYNAMITE',
    'COAL', 'IRON', 'STEEL',
  ],

  // action params
  MOVE: {
    duration: 41 * 8,
    spriteOrder: [1, 2],
    maxFrameOffset: 2,
    frameStep: 2,
  },
  MOVE_TURN: {
    duration: 41 * 10,
    spriteOrder: [1, 2],
    maxFrameOffset: 2,
    frameStep: 2,
  },
  TURN: {
    duration: 41 * 12,
    spriteOrder: [1, 2, 3, 4],
  },
  DIE: {
    duration: 41 * 2,
    spriteOrder: [8],
  },
};

const make = (
  game: Game, position: Vector,
): Player => {
  const player = {
    ...makeEntity(
      'DRILL', position,
      config.width, config.height,
    ),
    ...config,
    prevHP: config.hp,
    prevHPAge: 0,
    actions: [],
    riders: [],

    // this frame offset allows iterating through spritesheets across
    // multiple actions (rn only used by queen ant doing one full walk
    // cycle across two MOVE actions)
    frameOffset: 0,
    timeOnMove: 0, // for turning in place
  };

  return player
};

const render = (ctx, game: Game, agent: Agent): void => {
  renderAgent(ctx, game, agent, spriteRenderFn);
}

const spriteRenderFn = (ctx, game, drill) => {
  const {width, height} = drill;
  ctx.save();
  ctx.strokeStyle = "black";
  ctx.fillStyle = "steelblue";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeRect(0, 0, width, height);
  ctx.restore();

  // const sprite = getAntSpriteAndOffset(game, ant);
  // if (sprite.img != null) {
  //   ctx.drawImage(
  //     sprite.img, sprite.x, sprite.y, sprite.width, sprite.height,
  //     0, 0, ant.width, ant.height,
  //   );
  // }
}

module.exports = {
  config, make, render,
};

