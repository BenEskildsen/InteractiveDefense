// @flow

const React = require('react');
const InfoCard = require('../ui/Components/InfoCard.react');
const globalConfig = require('../config');
const {Entities} = require('../entities/registry');
const {
  canAffordBuilding, getModifiedCost,
} = require('../selectors/buildings');
const {useMemo, useEffect} = React;

function PlacementPalette(props): React.Node {
  const {dispatch, game, placeType} = props;

  const placeBuildingCards = []
  for (const entityType in Entities) {
    const config = Entities[entityType].config;
    if (config.cost == null) continue;
    placeBuildingCards.unshift(
      <PlaceBuildingCard key={"placeEntityCard_" + entityType}
        dispatch={dispatch}
        game={game}
        entityType={entityType}
        cost={getModifiedCost(game, entityType)}
        isSelected={entityType == placeType}
      />
    );
  }

  return (
    <span>
      <div>{placeBuildingCards}</div>
    </span>
  );
}


function PlaceBuildingCard(props) {
  const {dispatch, entityType, cost, isSelected, game} = props;

  // const hover = useMemo(() => {
  //   return (
  //     <HoverCard entityType={entityType} depth={0} />
  //   );
  // }, []);
  let name = entityType;
  if (Entities[entityType].config.name) {
    name = Entities[entityType].config.name;
  }
  return (
    <div
      style={{
        // display: 'inline-block',
        position: 'relative',
      }}
      onClick={() => dispatch({type: 'SET_PLACE_TYPE', placeType: entityType})}
    >
      <InfoCard
        border={isSelected ? '2px solid orange' : null}
        opacity={canAffordBuilding(game, cost) ? null : 0.5}
      >
        <div>{name}</div>
        <div>Cost: {cost}</div>
      </InfoCard>
    </div>
  );
}

function HoverCard(props) {
  const {entityType, depth} = props;
  const allDescriptions = globalConfig.config.descriptions;
  const {description, howToMake} = allDescriptions[entityType];

  let hoverableDescription = [];
  let hoverableHowToMake = [];
  if (depth < 4) {
    const splitDescription = description.split(' ');
    for (let term of splitDescription) {
      if (term == 'HOT_COAL') term = 'HOT COAL';
      if (allDescriptions[term] != null) {
        hoverableDescription.push(
          <div
            style={{
              display: 'inline'
            }}
            key={"hoverDesc_" + entityType + "_" + term + depth}
            className="displayChildOnHover"
          >
            <Resource resource={term} />
            <HoverCard entityType={term} depth={depth + 1} />
          </div>
        );
        hoverableDescription.push(' ');
      } else {
        hoverableDescription.push(term + ' ');
      }
    }
    let splitHowToMake = [];
    if (howToMake != null) {
      splitHowToMake = howToMake.split(' ');
    }
    for (let term of splitHowToMake) {
      if (term == 'HOT_COAL') term = 'HOT COAL';
      if (allDescriptions[term] != null) {
        hoverableHowToMake.push(
          <div
            style={{
              display: 'inline'
            }}
            key={"hoverHowTo_" + entityType + "_" + term + depth}
            className="displayChildOnHover"
          >
            <Resource resource={term} />
            <HoverCard entityType={term} depth={depth + 1} />
          </div>
        );
        hoverableHowToMake.push(' ');
      } else {
        hoverableHowToMake.push(term + ' ');
      }
    }
  } else {
    hoverableDescription = description;
    hoverableHowToMake = howToMake;
  }

  return (
    <div
      className="hidden"
      style={{
        position: 'absolute',
        top: 35,
        left: 35,
        width: 300,
        zIndex: depth + 5,
      }}
    >
      <InfoCard >
        <div style={{textAlign: 'center'}}><b>
          {depth == 0 ? "Details" : entityType}
        </b></div>
        <div>{hoverableDescription}</div>
        {howToMake != null ? (<div><b>Made From: </b>{hoverableHowToMake}</div>) : null}
      </InfoCard>
    </div>
  );
}

function Resource(props) {
  let {resource} = props;
  if (resource == 'HOT COAL') {
    resource = 'HOT_COAL';
  }

  let image = null;
  switch (resource) {
    case 'DIRT':
    case 'STONE':
    case 'COAL':
    case 'HOT_COAL':
    case 'IRON':
    case 'STEEL':
    case 'SULPHUR':
    case 'ICE':
    case 'URANIUM':
      image = (
        <div
          style={{
            display: 'inline-block',
            position: 'relative',
            overflow: 'hidden',
            width: 16,
            height: 16,
          }}
        >
          <img
            style={{
              position: 'absolute',
              top: 0,
              left: -64,
            }}
            src={"./img/" + resource + ".png"}
          />
        </div>
      );
      break;
    case 'TURBINE':
    case 'SOLAR_PANEL':
      image = (
        <img
          width={16}
          height={16}
          src={"./img/" + resource + ".png"}
        />
      );
      break;
    case 'BASIC_TURRET':
    case 'FAST_TURRET':
    case 'MISSILE_TURRET':
    case 'LASER_TURRET':
      image = (
        <img
          width={16}
          height={16}
          src={"./img/TURRET.png"}
        />
      );
      break;
    case 'SAND':
    case 'MOLTEN_SAND':
    case 'MOLTEN_IRON':
    case 'MOLTEN_STEEL':
    case 'WATER':
    case 'STEAM':
    case 'SULPHUR_DIOXIDE':
    case 'OIL':
    case 'HOT_OIL':
    case 'HEAT':
    case 'COLD':
      image = (
        <div
          style={{
            display: 'inline-block',
            width: 16,
            height: 16,
            border: '1px solid black',
            backgroundColor: globalConfig.pheromones[resource].color,
          }}
        ></div>
      );
      break;
    case 'POWER':
      image = (
        <div
          style={{
            display: 'inline-block',
            width: 16,
            height: 16,
            border: '1px solid black',
            backgroundColor: globalConfig.pheromones.SAND.color,
          }}
        ></div>
      );
      break;
    case 'FLUID':
      image = (
        <div
          style={{
            display: 'inline-block',
            width: 16,
            height: 16,
            border: '1px solid black',
            backgroundColor: globalConfig.pheromones.WATER.color,
          }}
        ></div>
      );
      break;
    case 'GAS':
      image = (
        <div
          style={{
            display: 'inline-block',
            width: 16,
            height: 16,
            border: '1px solid black',
            backgroundColor: globalConfig.pheromones.STEAM.color,
          }}
        ></div>
      );
      break;
    case 'SILICON':
      image = (
        <div
          style={{
            display: 'inline-block',
            width: 16,
            height: 16,
            backgroundColor: '#006400',
          }}
        ></div>
      );
      break;
    case 'GLASS':
      image = (
        <div
          style={{
            display: 'inline-block',
            position: 'relative',
            overflow: 'hidden',
            width: 16,
            height: 16,
          }}
        >
          <img
            style={{
              position: 'absolute',
              top: 0,
              left: -64,
              opacity: 0.7,
            }}
            src={"./img/STEEL.png"}
          />
        </div>
      );
      break;
  }

  return (
    <div
      style={{
        display: 'inline-block',
      }}
    >
      <b><span style={{color: 'steelblue'}}>{resource}</span></b>
      <div style={{
        display: 'inline-block',
        marginLeft: 2,
        verticalAlign: 'top',
      }}
      >{image}</div>
    </div>
  );
}

module.exports = PlacementPalette;
