// @flow

const {randomIn, normalIn, oneOf} = require('../utils/stochastic');
const globalConfig = require('../config');
const {Entities} = require('../entities/registry');

const initMonsterAttackSystem = (store) => {
  const {dispatch} = store;
  let time = -1;
  return store.subscribe(() => {
    const state = store.getState();
    const {game} = state;
    if (!game) return;
    if (game.time == time) return;
    time = game.time;

    if (game.pauseMonsters) {
      return;
    }

    const gameSeconds = game.totalGameTime / 1000;

    let spawnRate = Math.max(5, Math.round(150 - game.score));

    if (game.time > 0 && game.time % spawnRate == 0) {
      let position = {x: 0, y: 0};
      if (Math.random() < 0.5) {
        position.x = oneOf([0, game.gridWidth - 1]);
        position.y = randomIn(0, game.gridHeight - 1);
      } else {
        position.x = randomIn(0, game.gridWidth - 1);
        position.y = oneOf([0, game.gridHeight -1]);
      }
      const monster = Entities.MONSTER.make(game, position, 2);
      dispatch({type: 'CREATE_ENTITY', entity: monster});
    }

  });
};

function doWaveOver(dispatch, game, missileFrequency) {
  if (game.inWave) {
    dispatch({type: 'SET_IN_WAVE', inWave: false});
    dispatch({type: 'SET_WAVE_INDEX', waveIndex: game.waveIndex + 1});
    dispatch({type: 'SET_MISSILE_FREQUENCY', missileFrequency});
  }
}

function doStartWave(dispatch, game, missileFrequency) {
  if (!game.inWave) {
    dispatch({type: 'SET_IN_WAVE', inWave: true});
    dispatch({type: 'SET_MISSILE_FREQUENCY', missileFrequency});
    dispatch({type: 'SET_TICKER_MESSAGE',
      time: 4000,
      message: 'WAVE OF MISSILES INCOMING',
    });
  }
}

module.exports = {initMonsterAttackSystem};
