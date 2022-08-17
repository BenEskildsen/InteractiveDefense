// @flow

const globalConfig = require('../config');

/**
 * Entity creation checklist:
 *  - add the entity here keyed by type (in render order)
 *  - add the entities/entityType file to this directory
 *  - add the entities options and arguments to ui/LevelEditor
 *  - if the entity has any special properties, add them to properties/
 *  - if it blocks pheromones, add to the config
 */


const Entities = {
  BACKGROUND: require('./background.js'),
  DOODAD: require('./doodad.js'),

  DIRT: require('./dirt.js'),
  STONE: require('./stone.js'),
  STEEL: require('./steel.js'),

  AGENT: require('./agent.js'),

  TURRET: require('./basicTurret.js'),
  FAST_TURRET: require('./turret.js'),
  FARM: require('./farm.js'),
  SPLASH_TURRET: require('./splashTurret.js'),

  DYNAMITE: require('./dynamite.js'),
  NUKE: require('./nuke.js'),
  MISSILE: require('./missile.js'),
  BULLET: require('./bullet.js'),

  BASE: require('./base.js'),

  MONSTER: require('./monster.js'),
};

module.exports = {
  Entities,
};

