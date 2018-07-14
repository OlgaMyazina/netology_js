'use strict';
class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (!(vector instanceof Vector)) throw Error(`Можно прибавлять к вектору только вектор типа Vector`);
    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  times(nth) {
    return new Vector(this.x * nth, this.y * nth);
  }
}

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
      throw Error(`параметры должны быть типа Vector`);
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }
  get top() {
    return this.pos.y;
  }
  get left() {
    return this.pos.x;
  }
  get right() {
    return this.left + this.size.x;
  }
  get bottom() {
    return this.top + this.size.y;
  }
  get type() {
    return 'actor';
  }

  act() {}

  isIntersect(actor) {
    if (!(actor instanceof Actor)) throw Error(`должен быть объект типа Vector`);
    if (
      actor !== this &&
      (actor.top < this.bottom && this.top < actor.bottom && (actor.left < this.right && this.left < actor.right))
    ) {
      return true;
    }
    return false;
  }
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.height = this.grid.length;
    this.status = null;
    this.finishDelay = 1;
    this.player = this.actors.find(actor => actor.type === 'player');
    this.width = this.widthGrid();
  }

  widthGrid() {
    const maxCeils = this.grid.reduce((maxCeils, row) => {
      if (row.length > maxCeils) maxCeils = row.length;
      return maxCeils;
    }, 0);
    return maxCeils;
  }

  border(pos, size) {
    return [Math.floor(pos.y), Math.ceil(pos.x + size.x), Math.ceil(pos.y + size.y), Math.floor(pos.x)];
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }

  actorAt(actor) {
    if (!(actor instanceof Actor)) throw Error(`должен быть объект типа Vector`);
    for (let actorItem of this.actors) {
      if (actorItem.isIntersect(actor)) return actorItem;
    }
  }

  obstacleAt(pos, size) {
    if (!(pos instanceof Vector) || !(size instanceof Vector)) {
      throw Error(`аргументы должен быть объектами типа Vector`);
    }
    const [top, right, bottom, left] = this.border(pos, size);
    if (bottom > this.height) return 'lava';
    if (right > this.width || left < 0 || top < 0) return 'wall';
    for (let i = top; i < bottom; i++) {
      for (let j = left; j < right; j++) {
        if (this.grid[i][j]) return this.grid[i][j];
      }
    }
  }

  removeActor(actor) {
    const index = this.actors.indexOf(actor);
    if (index != -1) this.actors.splice(index, 1);
  }

  noMoreActors(typeActor) {
    for (let actor of this.actors) {
      if (actor.type === typeActor) return false;
    }
    return true;
  }

  playerTouched(typeObject, actor) {
    if (this.status == null) {
      if (typeObject === 'lava' || typeObject === 'fireball') this.status = 'lost';
      if (typeObject === 'coin') {
        this.removeActor(actor);
        if (this.noMoreActors(typeObject)) this.status = 'won';
      }
    }
  }
}

class LevelParser {
  constructor(dictionary) {
    this.dict = dictionary;
  }

  actorFromSymbol(symbol) {
    if (symbol && this.dict) return this.dict[symbol];
  }

  obstacleFromSymbol(symbol) {
    switch (symbol) {
      case 'x':
        return 'wall';
      case '!':
        return 'lava';
    }
  }

  createGrid(plan) {
    return plan.map(str => {
      return [...str].map(char => this.obstacleFromSymbol(char));
    });
  }

  createActors(plan) {
    const planActors = [];
    for (let i = 0; i < plan.length; i++) {
      for (let j = 0; j < plan[i].length; j++) {
        const actorObject = this.actorFromSymbol(plan[i][j]);
        if (actorObject && typeof actorObject === 'function') {
          const actor = new actorObject(new Vector(j, i));
          if (actor instanceof Actor) planActors.push(actor);
        }
      }
    }
    return planActors;
  }

  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan));
  }
}

class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    const size = new Vector(1, 1);
    super(pos, size, speed);
  }
  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, grid) {
    const nextPosition = this.getNextPosition(time);
    if (grid.obstacleAt(nextPosition, this.size)) this.handleObstacle();
    else this.pos = nextPosition;
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos) {
    const speed = new Vector(2, 0);
    super(pos, speed);
  }
}

class VerticalFireball extends Fireball {
  constructor(pos) {
    const speed = new Vector(0, 2);
    super(pos, speed);
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    const speed = new Vector(0, 3);
    super(pos, speed);
    this.nextPos = pos;
  }

  handleObstacle() {
    this.pos = this.nextPos;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    const newPosition = pos.plus(new Vector(0.2, 0.1));
    const size = new Vector(0.6, 0.6);
    super(newPosition, size);
    this.newPos = newPosition;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
  }
  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }
  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.newPos.plus(this.getSpringVector());
  }
  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(pos = new Vector(0, 0)) {
    const newPos = pos.plus(new Vector(0, -0.5));
    const size = new Vector(0.8, 1.5);
    super(newPos, size);
  }
  get type() {
    return 'player';
  }
}

const symbolDict = {
  x: 'wall',
  '!': 'lava',
  '@': Player,
  o: Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  v: FireRain
};

const schemas = [
  ['         ', '         ', '    =    ', '       o ', '     !xxx', ' @       ', 'xxx!     ', '         '],
  ['      v  ', '    v    ', '  v      ', '        o', '        x', '@   x    ', 'x        ', '         ']
];
const actorDict = {
  '@': Player,
  v: FireRain
};
const parser = new LevelParser(symbolDict);
runGame(schemas, parser, DOMDisplay).then(() => console.log('Вы выиграли приз!'));
