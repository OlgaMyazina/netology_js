'use strict';
class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  plus(vector) {
    if (!(vector instanceof Vector)) {
      throw Error(`Можно прибавлять к вектору только вектор типа Vector`);
    }
    return new Vector(this.x + vector.x, this.y + vector.y);
  }
  times(nth) {
    return new Vector(this.x * nth, this.y * nth);
  }
}

//Проверка class Vector
/*
const start = new Vector(30, 50;)
const moveTo = new Vector(5, 10);
const finish = start.plus(moveTo.times(2));

console.log(`Исходное расположение: ${start.x}:${start.y}`);
console.log(`Текущее расположение: ${finish.x}:${finish.y}`);
*/
//Результат
/*
Исходное расположение: 30:50
Текущее расположение: 40:70
 */

class Actor {
  constructor(
    pos = new Vector(0, 0),
    size = new Vector(1, 1),
    speed = new Vector(0, 0)
  ) {
    if (
      !(pos instanceof Vector) ||
      !(size instanceof Vector) ||
      !(speed instanceof Vector)
    ) {
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
    if (!(actor instanceof Actor) || !arguments.length)
      throw Error(`должен быть объект типа Vector`);
    if (actor === this) return false;
    if (
      actor.top < this.bottom &&
      this.top < actor.bottom &&
      (actor.left < this.right && this.left < actor.right)
    ) {
      return true;
    }
    return false;
  }
}

//Проверка кода
/*
const items = new Map();
const player = new Actor();
items.set('Игрок', player);
items.set('Первая монета', new Actor(new Vector(10, 10)));
items.set('Вторая монета', new Actor(new Vector(15, 5)));

function position(item) {
  return ['left', 'top', 'right', 'bottom']
    .map(side => `${side}: ${item[side]}`)
    .join(', ');
}

function movePlayer(x, y) {
  player.pos = player.pos.plus(new Vector(x, y));
}

function status(item, title) {
  console.log(`${title}: ${position(item)}`);
  if (player.isIntersect(item)) {
    console.log(`Игрок подобрал ${title}`);
  }
}

items.forEach(status);
movePlayer(10, 10);
items.forEach(status);
movePlayer(5, -5);
items.forEach(status);
*/
//Результат
/*
Игрок: left: 0, top: 0, right: 1, bottom: 1
Первая монета: left: 10, top: 10, right: 11, bottom: 11
Вторая монета: left: 15, top: 5, right: 16, bottom: 6
Игрок: left: 10, top: 10, right: 11, bottom: 11
Первая монета: left: 10, top: 10, right: 11, bottom: 11
Игрок подобрал Первая монета
Вторая монета: left: 15, top: 5, right: 16, bottom: 6
Игрок: left: 15, top: 5, right: 16, bottom: 6
Первая монета: left: 10, top: 10, right: 11, bottom: 11
Вторая монета: left: 15, top: 5, right: 16, bottom: 6
Игрок подобрал Вторая монета
*/

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.height = this.grid.length;
    this.status = null;
    this.finishDelay = 1;
  }
  get player() {
    return this.actors.find(actor => actor.type === 'player');
  }
  get width() {
    const maxCeils = this.grid.reduce((maxCeils, row) => {
      if (row.length > maxCeils) maxCeils = row.length;
      return maxCeils;
    }, 0);
    return maxCeils;
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }

  actorAt(actor) {
    if (!(actor instanceof Actor) || !arguments.length)
      throw Error(`должен быть объект типа Vector`);
    for (let actorItem of this.actors) {
      if (actorItem.isIntersect(actor)) return actorItem;
    }
    return undefined;
  }

  obstacleAt(pos, size) {
    if (
      !(pos instanceof Vector) ||
      !(size instanceof Vector) ||
      !arguments.length
    )
      throw Error(`аргументы должен быть объектами типа Vector`);
    const left = Math.floor(pos.x),
      right = Math.ceil(pos.x + size.x),
      top = Math.floor(pos.y),
      bottom = Math.ceil(pos.y + size.y);

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
    if (this.status !== null) return;
    if (typeObject === 'lava' || typeObject === 'fireball') {
      this.status = 'lost';
    }
    if (typeObject === 'coin') {
      this.removeActor(actor);
      if (this.noMoreActors(typeObject)) this.status = 'won';
    }
  }
}
//Проверка
/*
const grid = [[undefined, undefined], ['wall', 'wall']];

function MyCoin(title) {
  this.type = 'coin';
  this.title = title;
}
MyCoin.prototype = Object.create(Actor);
MyCoin.constructor = MyCoin;

const goldCoin = new MyCoin('Золото');
const bronzeCoin = new MyCoin('Бронза');
const player = new Actor();
const fireball = new Actor();

const level = new Level(grid, [goldCoin, bronzeCoin, player, fireball]);

level.playerTouched('coin', goldCoin);
level.playerTouched('coin', bronzeCoin);

if (level.noMoreActors('coin')) {
  console.log('Все монеты собраны');
  console.log(`Статус игры: ${level.status}`);
}

const obstacle = level.obstacleAt(new Vector(1, 1), player.size);
if (obstacle) {
  console.log(`На пути препятствие: ${obstacle}`);
}

const otherActor = level.actorAt(player);
if (otherActor === fireball) {
  console.log('Пользователь столкнулся с шаровой молнией');
}
*/
//Результат проверки
/*
Все монеты собраны
Статус игры: won
На пути препятствие: wall
Пользователь столкнулся с шаровой молнией
 */
