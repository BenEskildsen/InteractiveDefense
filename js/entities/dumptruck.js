// @flow

const {makeEntity} = require('./makeEntity');
const {getAntSpriteAndOffset} = require('../selectors/sprites');
const {renderAgent} = require('../render/renderAgent');

const config = {
  hp: 200,
  damage: 1,
  width: 3,
  height: 3,
  maxHold: 9,
  age: 0,

  AGENT: true,
  MANNED: true, // property where you can have a player ride
  LOADER: true, // can load held entities into other entities

  pickupTypes: [
    'FOOD', 'DIRT', 'TOKEN',
    'DYNAMITE', 'COAL', 'IRON', 'STEEL',
  ],
  blockingTypes: [
    'FOOD', 'DIRT', 'AGENT',
    'STONE', 'DOODAD', 'WORM',
    'TOKEN', 'DYNAMITE',
    'COAL', 'IRON', 'STEEL',
  ],

  // action params
  MOVE: {
    duration: 41 * 6,
    spriteOrder: [1, 2],
    maxFrameOffset: 2,
    frameStep: 2,
  },
  MOVE_TURN: {
    duration: 41 * 8,
    spriteOrder: [1, 2],
    maxFrameOffset: 2,
    frameStep: 2,
  },
  TURN: {
    duration: 41 * 10,
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
      'DUMPTRUCK', position,
      config.width, config.height,
    ),
    ...config,
    prevHP: config.hp,
    prevHPAge: 0,
    actions: [],
    riders: [],

    holding: null,
    holdingIDs: [], // treat holding like a stack

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
  ctx.fillStyle = "gray";
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

