// @flow

const {
  fadeAllPheromones, computeAllPheromoneSteadyState,
  setPheromone, fillPheromone, clearPheromone,
  refreshPheromones,
} = require('../simulation/pheromones');
const {
  lookupInGrid, getEntityPositions,
  entityInsideGrid,
} = require('../utils/gridHelpers');
const {
  makeAction, isActionTypeQueued, getDuration,
  queueAction, stackAction, cancelAction,
} = require('../simulation/actionQueue.js');
const {
  removeEntity, addEntity, changeEntityType, moveEntity,
  addSegmentToEntity, changePheromoneEmitterQuantity,
} = require('../simulation/entityOperations');
const {render} = require('../render/render');
const {
  getPosBehind, getPositionsInFront, onScreen,
} = require('../selectors/misc');
const {oneOf} = require('../utils/stochastic');
const {collides, collidesWith} = require('../selectors/collisions');
const {
  add, equals, subtract, magnitude, scale,
  makeVector, vectorTheta, floor, round,
  abs, dist,
} = require('../utils/vectors');
const {
  clamp, closeTo, encodePosition, decodePosition,
} = require('../utils/helpers');
const {getInterpolatedIndex, getDictIndexStr} = require('../selectors/sprites');
const {
  entityStartCurrentAction,
} = require('../simulation/actionOperations');
const {agentDecideAction} = require('../simulation/agentOperations');
const {
  getFreeNeighborPositions, areNeighbors,
  getNeighborEntities,
} = require('../selectors/neighbors');
const {
  getPheromoneAtPosition, getTemperature,
} = require('../selectors/pheromones');
const globalConfig = require('../config');
const {dealDamageToEntity} = require('../simulation/miscOperations');
const {Entities} = require('../entities/registry');
const {canAffordBuilding} = require('../selectors/buildings');

import type {
  Game, Entity, Action, Ant,
} from '../types';

let totalTime = 0;
const tickReducer = (game: Game, action: Action): GameState => {
  switch (action.type) {
    case 'START_TICK': {
      if (game != null && game.tickInterval != null) {
        return game;
      }

      game.prevTickTime = new Date().getTime();

      return {
        ...game,
        tickInterval: setInterval(
          // HACK: store is only available via window
          () => store.dispatch({type: 'TICK'}),
          globalConfig.config.msPerTick,
        ),
      };
    }
    case 'STOP_TICK': {
      clearInterval(game.tickInterval);
      game.tickInterval = null;

      return game;
    }
    case 'TICK': {
      return doTick(game);
    }
  }
  return game;
};

//////////////////////////////////////////////////////////////////////////
// Do Tick
//////////////////////////////////////////////////////////////////////////
const doTick = (game: Game): Game => {
  const curTickTime = new Date().getTime();

	game.time += 1;

  // initializations:
  if (game.time == 1) {
    game.prevTickTime = new Date().getTime();
    game.viewImage.allStale = true;
    computeAllPheromoneSteadyState(game);
    game.pheromoneWorker.postMessage({
      type: 'INIT',
      grid: game.grid,
      entities: game.entities,
      PHEROMONE_EMITTER: game.PHEROMONE_EMITTER || {},
      TURBINE: game.TURBINE || [],
    });
  }

  // game/frame timing
  game.timeSinceLastTick = curTickTime - game.prevTickTime;

  // these are the ECS "systems"
  keepControlledMoving(game);
  updateActors(game);
  updateAgents(game);
  updateTiledSprites(game);
  updateViewPos(game, false /*don't clamp to world*/);
  updateTicker(game);
  updatePheromoneEmitters(game);
  updateTowers(game);
  updateFarms(game);
  updateBases(game);
  updateBallistics(game);
  updateExplosives(game);

  updatePheromones(game);
  render(game);

  // update timing frames
  game.totalGameTime += curTickTime - game.prevTickTime;
  game.prevTickTime = curTickTime;

  return game;
};

//////////////////////////////////////////////////////////////////////////
// Updating Agents
//////////////////////////////////////////////////////////////////////////

const updateActors = (game): void => {
  let fn = () => {}

  // see comment below
  const notNextActors = {};

  for (const id in game.ACTOR) {
    const actor = game.entities[id];
    if (
      actor == null ||
      actor.actions == null ||
      actor.actions.length == 0
    ) {
      continue;
    }

    if (actor.AGENT) {
      fn = agentDecideAction;
    }
    stepAction(game, actor, fn);

    if (actor.actions.length == 0) {
      notNextActors[id] = true;
    }
  }

  // the reason for deleting them like this instead of just
  // tracking which ones should make it to the next tick, is that
  // new entities can be added to the ACTOR queue inside of stepAction
  // (e.g. an explosive killing another explosive) and they need
  // to make it to the next time this function is called
  for (const id in notNextActors) {
    delete game.ACTOR[id];
  }
}

const updateAgents = (game): void => {
	for (const id of game.AGENT) {
    const agent = game.entities[id];
    if (agent == null) {
      console.log("no agent with id", id);
      continue;
    }
    agent.age += game.timeSinceLastTick;
    agent.timeOnTask += game.timeSinceLastTick;
    agent.prevHPAge += game.timeSinceLastTick;

    if (agent.actions.length == 0) {
      agentDecideAction(game, agent);
    }
	}
}

//////////////////////////////////////////////////////////////////////////
// Explosives, ballistics
//////////////////////////////////////////////////////////////////////////

const updateExplosives = (game): void => {
  for (const id in game.EXPLOSIVE) {
    const explosive = game.entities[id];
    explosive.age += game.timeSinceLastTick;
    if (
      ((explosive.timer != null && explosive.age > explosive.timer)
        || explosive.timer == null)
      && explosive.position != null
      && !isActionTypeQueued(explosive, 'DIE')
    ) {
      queueAction(game, explosive, makeAction(game, explosive, 'DIE'));
    }
  }
};

const updateBallistics = (game): void => {
  for (const id in game.BALLISTIC) {
    const ballistic = game.entities[id];
    if (ballistic == null || ballistic.position == null) continue;
    ballistic.age += game.timeSinceLastTick;
    // if it has collided with something, deal damage to it and die
    // OR if it is within Radius of target, die
    const collisions =
      collidesWith(game, ballistic, ballistic.blockingTypes)
      .filter(e => e.playerID != ballistic.playerID);
    let inRadius = false;
    if (ballistic.warhead != null) {
      // const target = game.entities[ballistic.targetID];
      const target = {position: {...game.crosshairPos}};
      if (ballistic.targetPos) {
        target.position = ballistic.targetPos;
      }
      if (target != null) {
        if (Math.abs(dist(ballistic.position, target.position)) <= 1) {
          inRadius = true;
        }
      }
    }

    if (collisions.length > 0 || inRadius) {
      if (ballistic.missRate == null ||
        (ballistic.missRate != null && Math.random() > ballistic.missRate)
      ) {
        const alreadyDamaged = {};
        collisions.forEach(e => {
          if (alreadyDamaged[e.id]) return;
          alreadyDamaged[e.id] = true;
          if (ballistic.PIERCING && e.COLLECTABLE) {
            ballistic.hp -= e.hp / 20;
          }
          if (e.type == 'BASE') {
            game.miniTicker = {
              time: 3000,
              max: 3000,
              message: 'BASE HIT',
            };
          }
          dealDamageToEntity(game, e, ballistic.damage);
        });


        if (!ballistic.PIERCING || ballistic.hp <= 0) {
          queueAction(game, ballistic, makeAction(game, ballistic, 'DIE'));
        }

        continue;
      }
    }

    // otherwise continue along its trajectory
    let {age, initialTheta, velocity, width, height} = ballistic;
    const prevPosition = add(
      ballistic.ballisticPosition,
      {x: width / 2, y: height / 2},
    );
    if (ballistic.prevPositions) {
      ballistic.prevPositions.push(prevPosition);
    }

    const {x, y} = ballistic.initialPosition;
    age /= 10000;
    ballistic.ballisticPosition = {
      x: x + velocity * age * Math.cos(initialTheta),
      y: y + velocity * age * Math.sin(initialTheta)
        - 0.5 * globalConfig.config.gravity * age * age,
    };
    ballistic.ballisticTheta = vectorTheta(subtract(
      add(
        ballistic.ballisticPosition,
        {x: width / 2, y: height / 2},
      ),
      prevPosition,
    ));

    moveEntity(game, ballistic, round(ballistic.ballisticPosition));
    if (!entityInsideGrid(game, ballistic)) {
      queueAction(game, ballistic, makeAction(game, ballistic, 'DIE'));
    }
  }
};

//////////////////////////////////////////////////////////////////////////
// Towers
//////////////////////////////////////////////////////////////////////////

const updateTowers = (game): void => {
  for (const id in game.TOWER) {
    const tower = game.entities[id];
    const config = Entities[tower.type].config;

    // choose target if possible
    if (tower.targetID == null && !tower.TARGETED) {
      const possibleTargets = [];
      for (const monsterID of game.MONSTER) {
        const monster = game.entities[monsterID];
        if (monster.playerID != tower.playerID) {
          possibleTargets.push(monsterID);
        }
      }

      const highPriTargets = [];
      const baseNeighbors =
        getNeighborEntities(game, game.entities[game.BASE[0]], true /*external*/)
          .concat(getNeighborEntities(game, tower, true /*external*/));
      for (const entity of baseNeighbors) {
        if (entity.type == 'MONSTER') {
          highPriTargets.push(entity.id);
        }
      }

      if (highPriTargets.length > 0) {
        tower.targetID = oneOf(highPriTargets);
      } else {
        tower.targetID = oneOf(possibleTargets);
      }
    }

    let projectileType = game.placeType;

    // get theta to target
    let targetTheta = 0;
    let targetPos = game.crosshairPos;
    let usedQueuedTarget = false;
    if (tower.targetID != null) {
      const target = game.entities[tower.targetID];
      // clear dead target
      if (target == null) {
        tower.targetID = null;
      // else aim at living target
      } else {
        const targetPos = game.entities[tower.targetID].position;
        const towerPos = add({x: 0.5, y: 0.5}, tower.position);
        targetTheta = vectorTheta(subtract(towerPos, targetPos));
      }
    } else if (
      tower.TARGETED &&
      (game.crosshairPos || (tower.targetQueue && tower.targetQueue.length > 0))
    ) {
      if (tower.targetQueue && tower.targetQueue.length > 0) {
        const queuedTarget = tower.targetQueue.shift();
        usedQueuedTarget = true;
        targetPos = queuedTarget.position;
        projectileType = queuedTarget.projectileType
      }
      const towerPos = add({x: 0.5, y: 0.5}, tower.position);
      targetTheta = vectorTheta(subtract(towerPos, targetPos));
    }


    let shouldShoot = false;
    if (Math.abs(tower.theta - targetTheta) <= tower.maxThetaSpeed) {
      tower.theta = targetTheta;
      shouldShoot = true;
    } else if (
      (tower.theta < targetTheta && targetTheta - tower.theta < Math.PI) ||
      (tower.theta > targetTheta && tower.theta - targetTheta > Math.PI)
    ) {
      tower.thetaSpeed = config.maxThetaSpeed;
      tower.theta += tower.thetaSpeed;
    } else if (
      (tower.theta < targetTheta && targetTheta - tower.theta > Math.PI) ||
      (tower.theta > targetTheta && tower.theta - targetTheta < Math.PI)
    ) {
      tower.thetaSpeed = -1 * config.maxThetaSpeed;
      tower.theta += tower.thetaSpeed;
    }
    tower.theta = (2 * Math.PI + tower.theta) % (2 * Math.PI);

    // shoot at target
    let didShoot = false;
    let canAfford = true;
    if (
      (tower.targetID != null || tower.TARGETED)
        && !isActionTypeQueued(tower, 'SHOOT') && shouldShoot
    ) {
      if (tower.needsCooldown) {
        tower.shotsSinceCooldown += 1;
        if (tower.shotsSinceCooldown > tower.shotsTillCooldown) {
          tower.shotsSinceCooldown = 0;
          queueAction(
            game, tower,
            makeAction(game, tower, 'COOLDOWN', null),
          );
        }
      }

      let cost = 0;
      if (Entities[projectileType].config.cost) {
        cost = Entities[projectileType].config.cost;
        if (!canAffordBuilding(game, cost)) {
          canAfford = false;
          tower.targetQueue = [];
          game.placeType = 'BULLET';
        }
      }

      let unoccupied = true;
      if (projectileType == 'DIRT') {
        unoccupied = lookupInGrid(game.grid, targetPos)
          .map(id => game.entities[id])
          .filter(e => e.type == 'DIRT')
          .length == 0;
      }

      if (canAfford && unoccupied) {
        game.money -= cost;
        const action =
          makeAction(
            game, tower, 'SHOOT',
            // {theta: tower.theta, projectileType: tower.projectileType}
            {theta: tower.theta, projectileType, targetPos}
          );
        if (projectileType == 'DIRT') {
          action.duration /= 3;
        }
        queueAction(
          game, tower, action,
        );
        didShoot = true;
      }
    }
    // put queued target back
    if (!didShoot && usedQueuedTarget && canAfford) {
      tower.targetQueue.unshift({position: targetPos, projectileType});
    }

  }
};

//////////////////////////////////////////////////////////////////////////
// Generators, Bases
//////////////////////////////////////////////////////////////////////////

const updateBases = (game: Game): void => {
  for (const id of game.BASE) {
    const base = game.entities[id];
  }
};

const updateFarms = (game: Game): void => {
  for (const id of game.FARM) {
    const farm = game.entities[id];
    farm.theta += farm.maxThetaSpeed;
    farm.theta = farm.theta % (2 * Math.PI);
  }
}

//////////////////////////////////////////////////////////////////////////
// Move controlledEntity/View
//////////////////////////////////////////////////////////////////////////

/**
 * If the queen isn't moving but you're still holding the key down,
 * then just put a move action back on the action queue
 */
const keepControlledMoving = (game: Game): void => {
  const controlledEntity = game.controlledEntity;
  if (!controlledEntity) return;
  const moveDir = {x: 0, y: 0};
  if (game.hotKeys.keysDown.up) {
    moveDir.y += 1;
  }
  if (game.hotKeys.keysDown.down) {
    moveDir.y -= 1;
  }
  if (game.hotKeys.keysDown.left) {
    moveDir.x -= 1;
  }
  if (game.hotKeys.keysDown.right) {
    moveDir.x += 1;
  }
  if (!equals(moveDir, {x: 0, y: 0})) {
    controlledEntity.timeOnMove += 1;
  } else {
    controlledEntity.timeOnMove = 0;
  }

  if (
    !equals(moveDir, {x: 0, y: 0}) && !isActionTypeQueued(controlledEntity, 'MOVE', true)
    && !isActionTypeQueued(controlledEntity, 'MOVE_TURN', true)
    && !isActionTypeQueued(controlledEntity, 'TURN') // enables turning in place
    && !isActionTypeQueued(controlledEntity, 'DASH')
  ) {
    const nextPos = add(controlledEntity.position, moveDir);
    const nextTheta = vectorTheta(subtract(controlledEntity.position, nextPos));
    let entityAction = makeAction(
      game, controlledEntity, 'MOVE',
      {
        nextPos,
        frameOffset: controlledEntity.frameOffset,
      },
    );
    if (!closeTo(nextTheta, controlledEntity.theta)) {
      if (controlledEntity.timeOnMove > 1) {
        entityAction = makeAction(
          game, controlledEntity, 'MOVE_TURN',
          {
            nextPos,
            nextTheta,
            frameOffset: controlledEntity.frameOffset,
          },
        );
        controlledEntity.prevTheta = controlledEntity.theta;
      } else {
        entityAction = makeAction(
          game, controlledEntity, 'TURN', nextTheta,
        );
      }
    }
    controlledEntity.timeOnMove = 0;
    queueAction(game, controlledEntity, entityAction);
  }
}

const updateViewPos = (
  game: Game,clampToGrid: boolean,
): void => {
  let nextViewPos = {...game.viewPos};
  const focusedEntity = game.focusedEntity;
  if (focusedEntity) {
    const moveDir = subtract(focusedEntity.position, focusedEntity.prevPosition);
    const action = focusedEntity.actions[0];
    if (
      action != null &&
      (action.type == 'MOVE' || action.type == 'DASH' || action.type == 'MOVE_TURN')
    ) {
      const index = getInterpolatedIndex(game, focusedEntity);
      const duration = getDuration(game, focusedEntity, action.type);
      nextViewPos = add(
        nextViewPos,
        scale(moveDir, Math.min(1, game.timeSinceLastTick/duration)),
      );
    } else if (action == null) {
      const idealPos = {
        x: focusedEntity.position.x - game.viewWidth / 2,
        y: focusedEntity.position.y - game.viewHeight /2,
      };
      const diff = subtract(idealPos, nextViewPos);
      // NOTE: this allows smooth panning to correct view position
      const duration = getDuration(game, focusedEntity, 'MOVE');
      nextViewPos = add(nextViewPos, scale(diff, 16/duration));
    }
  }

  // rumble screen from foot
  // const foot = game.entities[game.FOOT[0]];
  // if (foot != null && foot.actions[0] != null && foot.actions[0].type == 'STOMP') {
  //   const duration = getDuration(game, foot, 'STOMP');
  //   const actionIndex = duration - foot.actions[0].duration;
  //   if (game.config.FOOT.rumbleTicks > actionIndex) {
  //     const magnitude = 4 * actionIndex / duration - 3;
  //     nextViewPos = {
  //       x: magnitude * Math.random() + queen.position.x - game.viewWidth / 2,
  //       y: magnitude * Math.random() + queen.position.y - game.viewHeight / 2,
  //     };
  //   } else if (!onScreen(game, foot) && actionIndex == gme.config.FOOT.rumbleTicks) {
  //     // if the foot doesn't stomp on screen, reset the view immediately after rumbling
  //     // else it looks jarring to shift the screen without the foot also moving
  //     if (focusedEntity != null) {
  //       nextViewPos = {
  //         x: focusedEntity.position.x - game.viewWidth / 2,
  //         y: focusedEntity.position.y - game.viewHeight /2,
  //       };
  //     }
  //   }
  // }

  nextViewPos = {
    x: Math.round(nextViewPos.x * 100) / 100,
    y: Math.round(nextViewPos.y * 100) / 100,
  };

  if (!clampToGrid) {
    if (!equals(game.viewPos, nextViewPos)) {
      game.viewPos = nextViewPos;
    }
  } else {
    game.viewPos = {
      x: clamp(nextViewPos.x, 0, game.gridWidth - game.viewWidth),
      y: clamp(nextViewPos.y, 0, game.gridHeight - game.viewHeight),
    };
  }
}

//////////////////////////////////////////////////////////////////////////
// Pheromones
//////////////////////////////////////////////////////////////////////////

const updatePheromoneEmitters = (game: Game): void => {
  for (const id in game.PHEROMONE_EMITTER) {
    const emitter = game.entities[id];
    if (emitter.quantity == 0) continue;
    if (emitter.refreshRate == null) continue;

    if ((game.time + emitter.id) % emitter.refreshRate == 0) {
      changePheromoneEmitterQuantity(game, emitter, emitter.quantity);
    }
  }
};

const updatePheromones = (game: Game): void => {

  if (game.time % globalConfig.config.dispersingPheromoneUpdateRate == 0) {
    game.pheromoneWorker.postMessage({
      type: 'DISPERSE_PHEROMONES',
    });
  }

  // recompute steady-state-based pheromones using the worker
  if (game.reverseFloodFillSources.length > 0) {
    game.pheromoneWorker.postMessage({
      type: 'REVERSE_FLOOD_FILL',
      reverseFloodFillSources: game.reverseFloodFillSources,
    });
    game.reverseFloodFillSources = [];
  }
  if (game.floodFillSources.length > 0) {
    game.pheromoneWorker.postMessage({
      type: 'FLOOD_FILL',
      floodFillSources: game.floodFillSources,
    });
    game.floodFillSources = [];
  }
};

//////////////////////////////////////////////////////////////////////////
// Doing Actions
//////////////////////////////////////////////////////////////////////////

const stepAction = (
  game: Game, entity: Entity, decisionFunction: mixed,
): void => {
  if (entity.actions == null || entity.actions.length == 0) return;

  let curAction = entity.actions[0];
  const totalDuration = getDuration(game, entity, curAction.type);
  if (
    totalDuration - curAction.duration >= curAction.effectIndex &&
    !curAction.effectDone
  ) {
    entityStartCurrentAction(game, entity);
    curAction = entity.actions[0];
  } else if (curAction.duration <= 0) {
    const prevAction = entity.actions.shift();
    entity.prevActionType = prevAction.type;
    curAction = entity.actions[0];
    if (curAction == null) {
      decisionFunction(game, entity);
      curAction = entity.actions[0];
    }
    if (curAction != null && curAction.effectIndex == 0) {
      entityStartCurrentAction(game, entity);
    }
  }
  if (curAction != null) {
    curAction.duration = Math.max(0, curAction.duration - game.timeSinceLastTick);
  }
}

//////////////////////////////////////////////////////////////////////////
// Misc.
//////////////////////////////////////////////////////////////////////////

const updateTiledSprites = (game): void => {
  for (const id of game.staleTiles) {
    const entity = game.entities[id];
    entity.dictIndexStr = getDictIndexStr(game, entity);
  }
  game.staleTiles = [];
}

const updateTicker = (game): void => {
  if (game.ticker != null) {
    game.ticker.time -= game.timeSinceLastTick;
    if (game.ticker.time <= 0) {
      game.ticker = null;
    }
  }

  if (game.miniTicker != null) {
    game.miniTicker.time -= game.timeSinceLastTick;
    if (game.miniTicker.time <= 0) {
      game.miniTicker = null;
    }
  }
};

module.exports = {tickReducer};
