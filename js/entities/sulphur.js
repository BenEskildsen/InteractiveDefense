// @flow

const {
  getTileSprite,
} = require('../selectors/sprites');
const {makeEntity} = require('./makeEntity');

const config = {
  TILED: true,
  COLLECTABLE: true,
  hp: 10,
};

const make = (
  game: Game,
  position: Vector,
	width: ?number,
	height: ?number,
): Dirt => {
	return {
    ...makeEntity('SULPHUR', position, width, height),
    ...config,
    marked: null,
    dictIndexStr: '',
  };
};

const render = (ctx, game, sulphur): void => {
  const obj = getTileSprite(game, sulphur);

  if (obj == null || obj.img == null) return;
  ctx.drawImage(
    obj.img,
    obj.x, obj.y, obj.width, obj.height,
    sulphur.position.x, sulphur.position.y, sulphur.width, sulphur.height,
  );
}

module.exports = {
  make, render, config,
};
