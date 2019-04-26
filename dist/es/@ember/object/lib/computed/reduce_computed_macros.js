/**
@module @ember/object
*/
import { DEBUG } from '@glimmer/env';
import { assert } from '@ember/debug';
import {
  get,
  computed,
  ComputedProperty,
  addObserver,
  removeObserver,
} from '@ember/-internals/metal';
import { compare, isArray, A as emberA, uniqBy as uniqByArray } from '@ember/-internals/runtime';

function reduceMacro(dependentKey, callback, initialValue, name) {
  assert(
    `Dependent key passed to \`computed.${name}\` shouldn't contain brace expanding pattern.`,
    !/[\[\]\{\}]/g.test(dependentKey)
  );

  let cp = new ComputedProperty(
    function() {
      let arr = get(this, dependentKey);
      if (arr === null || typeof arr !== 'object') {
        return initialValue;
      }
      return arr.reduce(callback, initialValue, this);
    },
    { dependentKeys: [`${dependentKey}.[]`], readOnly: true }
  );

  return cp;
}

function arrayMacro(dependentKey, additionalDependentKeys, callback) {
  // This is a bit ugly
  let propertyName;
  if (/@each/.test(dependentKey)) {
    propertyName = dependentKey.replace(/\.@each.*$/, '');
  } else {
    propertyName = dependentKey;
    dependentKey += '.[]';
  }

  return computed(dependentKey, ...additionalDependentKeys, function() {
    let value = get(this, propertyName);
    if (isArray(value)) {
      return emberA(callback.call(this, value));
    } else {
      return emberA();
    }
  }).readOnly();
}

function multiArrayMacro(_dependentKeys, callback, name) {
  assert(
    `Dependent keys passed to \`computed.${name}\` shouldn't contain brace expanding pattern.`,
    _dependentKeys.every(dependentKey => !/[\[\]\{\}]/g.test(dependentKey))
  );
  let dependentKeys = _dependentKeys.map(key => `${key}.[]`);

  let cp = new ComputedProperty(
    function() {
      return emberA(callback.call(this, _dependentKeys));
    },
    { dependentKeys, readOnly: true }
  );

  return cp;
}

/**
  A computed property that returns the sum of the values
  in the dependent array.

  @method sum
  @for @ember/object/computed
  @static
  @param {String} dependentKey
  @return {ComputedProperty} computes the sum of all values in the dependentKey's array
  @since 1.4.0
  @public
*/
export function sum(dependentKey) {
  return reduceMacro(dependentKey, (sum, item) => sum + item, 0, 'sum');
}

/**
  A computed property that calculates the maximum value in the
  dependent array. This will return `-Infinity` when the dependent
  array is empty.

  ```javascript
  import { mapBy, max } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let Person = EmberObject.extend({
    childAges: mapBy('children', 'age'),
    maxChildAge: max('childAges')
  });

  let lordByron = Person.create({ children: [] });

  lordByron.get('maxChildAge'); // -Infinity
  lordByron.get('children').pushObject({
    name: 'Augusta Ada Byron', age: 7
  });
  lordByron.get('maxChildAge'); // 7
  lordByron.get('children').pushObjects([{
    name: 'Allegra Byron',
    age: 5
  }, {
    name: 'Elizabeth Medora Leigh',
    age: 8
  }]);
  lordByron.get('maxChildAge'); // 8
  ```

  If the types of the arguments are not numbers,
  they will be converted to numbers and the type
  of the return value will always be `Number`.
  For example, the max of a list of Date objects will be
  the highest timestamp as a `Number`.
  This behavior is consistent with `Math.max`.

  @method max
  @for @ember/object/computed
  @static
  @param {String} dependentKey
  @return {ComputedProperty} computes the largest value in the dependentKey's array
  @public
*/
export function max(dependentKey) {
  return reduceMacro(dependentKey, (max, item) => Math.max(max, item), -Infinity, 'max');
}

/**
  A computed property that calculates the minimum value in the
  dependent array. This will return `Infinity` when the dependent
  array is empty.

  ```javascript
  import { mapBy, min } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let Person = EmberObject.extend({
    childAges: mapBy('children', 'age'),
    minChildAge: min('childAges')
  });

  let lordByron = Person.create({ children: [] });

  lordByron.get('minChildAge'); // Infinity
  lordByron.get('children').pushObject({
    name: 'Augusta Ada Byron', age: 7
  });
  lordByron.get('minChildAge'); // 7
  lordByron.get('children').pushObjects([{
    name: 'Allegra Byron',
    age: 5
  }, {
    name: 'Elizabeth Medora Leigh',
    age: 8
  }]);
  lordByron.get('minChildAge'); // 5
  ```

  If the types of the arguments are not numbers,
  they will be converted to numbers and the type
  of the return value will always be `Number`.
  For example, the min of a list of Date objects will be
  the lowest timestamp as a `Number`.
  This behavior is consistent with `Math.min`.

  @method min
  @for @ember/object/computed
  @static
  @param {String} dependentKey
  @return {ComputedProperty} computes the smallest value in the dependentKey's array
  @public
*/
export function min(dependentKey) {
  return reduceMacro(dependentKey, (min, item) => Math.min(min, item), Infinity, 'min');
}

/**
  Returns an array mapped via the callback

  The callback method you provide should have the following signature.
  `item` is the current item in the iteration.
  `index` is the integer index of the current item in the iteration.

  ```javascript
  function(item, index);
  ```

  Example

  ```javascript
  import { map } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let Hamster = EmberObject.extend({
    excitingChores: map('chores', function(chore, index) {
      return chore.toUpperCase() + '!';
    })
  });

  let hamster = Hamster.create({
    chores: ['clean', 'write more unit tests']
  });

  hamster.get('excitingChores'); // ['CLEAN!', 'WRITE MORE UNIT TESTS!']
  ```

  You can optionally pass an array of additional dependent keys as the second
  parameter to the macro, if your map function relies on any external values:

  ```javascript
  import { map } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let Hamster = EmberObject.extend({
    excitingChores: map('chores', ['shouldUpperCase'], function(chore, index) {
      if (this.shouldUpperCase) {
        return chore.toUpperCase() + '!';
      } else {
        return chore + '!';
      }
    })
  });

  let hamster = Hamster.create({
    shouldUpperCase: false,

    chores: ['clean', 'write more unit tests']
  });

  hamster.get('excitingChores'); // ['clean!', 'write more unit tests!']
  hamster.set('shouldUpperCase', true);
  hamster.get('excitingChores'); // ['CLEAN!', 'WRITE MORE UNIT TESTS!']
  ```

  @method map
  @for @ember/object/computed
  @static
  @param {String} dependentKey
  @param {Array} [additionalDependentKeys] optional array of additional dependent keys
  @param {Function} callback
  @return {ComputedProperty} an array mapped via the callback
  @public
*/
export function map(dependentKey, additionalDependentKeys, callback) {
  if (callback === undefined && typeof additionalDependentKeys === 'function') {
    callback = additionalDependentKeys;
    additionalDependentKeys = [];
  }

  assert(
    'The final parameter provided to map must be a callback function',
    typeof callback === 'function'
  );

  assert(
    'The second parameter provided to map must either be the callback or an array of additional dependent keys',
    Array.isArray(additionalDependentKeys)
  );

  return arrayMacro(dependentKey, additionalDependentKeys, function(value) {
    return value.map(callback, this);
  });
}

/**
  Returns an array mapped to the specified key.

  ```javascript
  import { mapBy } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let Person = EmberObject.extend({
    childAges: mapBy('children', 'age')
  });

  let lordByron = Person.create({ children: [] });

  lordByron.get('childAges'); // []
  lordByron.get('children').pushObject({ name: 'Augusta Ada Byron', age: 7 });
  lordByron.get('childAges'); // [7]
  lordByron.get('children').pushObjects([{
    name: 'Allegra Byron',
    age: 5
  }, {
    name: 'Elizabeth Medora Leigh',
    age: 8
  }]);
  lordByron.get('childAges'); // [7, 5, 8]
  ```

  @method mapBy
  @for @ember/object/computed
  @static
  @param {String} dependentKey
  @param {String} propertyKey
  @return {ComputedProperty} an array mapped to the specified key
  @public
*/
export function mapBy(dependentKey, propertyKey) {
  assert(
    '`computed.mapBy` expects a property string for its second argument, ' +
      'perhaps you meant to use "map"',
    typeof propertyKey === 'string'
  );
  assert(
    `Dependent key passed to \`computed.mapBy\` shouldn't contain brace expanding pattern.`,
    !/[\[\]\{\}]/g.test(dependentKey)
  );

  return map(`${dependentKey}.@each.${propertyKey}`, item => get(item, propertyKey));
}

/**
  Filters the array by the callback.

  The callback method you provide should have the following signature.
  `item` is the current item in the iteration.
  `index` is the integer index of the current item in the iteration.
  `array` is the dependant array itself.

  ```javascript
  function(item, index, array);
  ```

  ```javascript
  import { filter } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let Hamster = EmberObject.extend({
    remainingChores: filter('chores', function(chore, index, array) {
      return !chore.done;
    })
  });

  let hamster = Hamster.create({
    chores: [
      { name: 'cook', done: true },
      { name: 'clean', done: true },
      { name: 'write more unit tests', done: false }
    ]
  });

  hamster.get('remainingChores'); // [{name: 'write more unit tests', done: false}]
  ```

  You can also use `@each.property` in your dependent key, the callback will still use the underlying array:

  ```javascript
  import { A } from '@ember/array';
  import { filter } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let Hamster = EmberObject.extend({
    remainingChores: filter('chores.@each.done', function(chore, index, array) {
      return !chore.get('done');
    })
  });

  let hamster = Hamster.create({
    chores: A([
      EmberObject.create({ name: 'cook', done: true }),
      EmberObject.create({ name: 'clean', done: true }),
      EmberObject.create({ name: 'write more unit tests', done: false })
    ])
  });
  hamster.get('remainingChores'); // [{name: 'write more unit tests', done: false}]
  hamster.get('chores').objectAt(2).set('done', true);
  hamster.get('remainingChores'); // []
  ```

  Finally, you can optionally pass an array of additional dependent keys as the
  second parameter to the macro, if your filter function relies on any external
  values:

  ```javascript
  import { filter } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let Hamster = EmberObject.extend({
    remainingChores: filter('chores', ['doneKey'], function(chore, index, array) {
      return !chore[this.doneKey];
    })
  });

  let hamster = Hamster.create({
    doneKey: 'finished'

    chores: [
      { name: 'cook', finished: true },
      { name: 'clean', finished: true },
      { name: 'write more unit tests', finished: false }
    ]
  });

  hamster.get('remainingChores'); // [{name: 'write more unit tests', finished: false}]
  ```

  @method filter
  @for @ember/object/computed
  @static
  @param {String} dependentKey
  @param {Array} [additionalDependentKeys] optional array of additional dependent keys
  @param {Function} callback
  @return {ComputedProperty} the filtered array
  @public
*/
export function filter(dependentKey, additionalDependentKeys, callback) {
  if (callback === undefined && typeof additionalDependentKeys === 'function') {
    callback = additionalDependentKeys;
    additionalDependentKeys = [];
  }

  assert(
    'The final parameter provided to filter must be a callback function',
    typeof callback === 'function'
  );

  assert(
    'The second parameter provided to filter must either be the callback or an array of additional dependent keys',
    Array.isArray(additionalDependentKeys)
  );

  return arrayMacro(dependentKey, additionalDependentKeys, function(value) {
    return value.filter(callback, this);
  });
}

/**
  Filters the array by the property and value

  ```javascript
  import { filterBy } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let Hamster = EmberObject.extend({
    remainingChores: filterBy('chores', 'done', false)
  });

  let hamster = Hamster.create({
    chores: [
      { name: 'cook', done: true },
      { name: 'clean', done: true },
      { name: 'write more unit tests', done: false }
    ]
  });

  hamster.get('remainingChores'); // [{ name: 'write more unit tests', done: false }]
  ```

  @method filterBy
  @for @ember/object/computed
  @static
  @param {String} dependentKey
  @param {String} propertyKey
  @param {*} value
  @return {ComputedProperty} the filtered array
  @public
*/
export function filterBy(dependentKey, propertyKey, value) {
  assert(
    `Dependent key passed to \`computed.filterBy\` shouldn't contain brace expanding pattern.`,
    !/[\[\]\{\}]/g.test(dependentKey)
  );

  let callback;
  if (arguments.length === 2) {
    callback = item => get(item, propertyKey);
  } else {
    callback = item => get(item, propertyKey) === value;
  }

  return filter(`${dependentKey}.@each.${propertyKey}`, callback);
}

/**
  A computed property which returns a new array with all the unique
  elements from one or more dependent arrays.

  Example

  ```javascript
  import { uniq } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let Hamster = EmberObject.extend({
    uniqueFruits: uniq('fruits')
  });

  let hamster = Hamster.create({
    fruits: [
      'banana',
      'grape',
      'kale',
      'banana'
    ]
  });

  hamster.get('uniqueFruits'); // ['banana', 'grape', 'kale']
  ```

  @method uniq
  @for @ember/object/computed
  @static
  @param {String} propertyKey*
  @return {ComputedProperty} computes a new array with all the
  unique elements from the dependent array
  @public
*/
export function uniq(...args) {
  return multiArrayMacro(
    args,
    function(dependentKeys) {
      let uniq = emberA();
      let seen = new Set();

      dependentKeys.forEach(dependentKey => {
        let value = get(this, dependentKey);
        if (isArray(value)) {
          value.forEach(item => {
            if (!seen.has(item)) {
              seen.add(item);
              uniq.push(item);
            }
          });
        }
      });

      return uniq;
    },
    'uniq'
  );
}

/**
  A computed property which returns a new array with all the unique
  elements from an array, with uniqueness determined by specific key.

  Example

  ```javascript
  import { uniqBy } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let Hamster = EmberObject.extend({
    uniqueFruits: uniqBy('fruits', 'id')
  });
  let hamster = Hamster.create({
    fruits: [
      { id: 1, 'banana' },
      { id: 2, 'grape' },
      { id: 3, 'peach' },
      { id: 1, 'banana' }
    ]
  });
  hamster.get('uniqueFruits'); // [ { id: 1, 'banana' }, { id: 2, 'grape' }, { id: 3, 'peach' }]
  ```

  @method uniqBy
  @for @ember/object/computed
  @static
  @param {String} dependentKey
  @param {String} propertyKey
  @return {ComputedProperty} computes a new array with all the
  unique elements from the dependent array
  @public
*/
export function uniqBy(dependentKey, propertyKey) {
  assert(
    `Dependent key passed to \`computed.uniqBy\` shouldn't contain brace expanding pattern.`,
    !/[\[\]\{\}]/g.test(dependentKey)
  );

  let cp = new ComputedProperty(
    function() {
      let list = get(this, dependentKey);
      return isArray(list) ? uniqByArray(list, propertyKey) : emberA();
    },
    { dependentKeys: [`${dependentKey}.[]`], readOnly: true }
  );

  return cp;
}

/**
  A computed property which returns a new array with all the unique
  elements from one or more dependent arrays.

  Example

  ```javascript
  import { union } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let Hamster = EmberObject.extend({
    uniqueFruits: union('fruits', 'vegetables')
  });

  let hamster = Hamster.create({
    fruits: [
      'banana',
      'grape',
      'kale',
      'banana',
      'tomato'
    ],
    vegetables: [
      'tomato',
      'carrot',
      'lettuce'
    ]
  });

  hamster.get('uniqueFruits'); // ['banana', 'grape', 'kale', 'tomato', 'carrot', 'lettuce']
  ```

  @method union
  @for @ember/object/computed
  @static
  @param {String} propertyKey*
  @return {ComputedProperty} computes a new array with all the
  unique elements from one or more dependent arrays.
  @public
*/
export let union = uniq;

/**
  A computed property which returns a new array with all the elements
  two or more dependent arrays have in common.

  Example

  ```javascript
  import { intersect } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let obj = EmberObject.extend({
    friendsInCommon: intersect('adaFriends', 'charlesFriends')
  }).create({
    adaFriends: ['Charles Babbage', 'John Hobhouse', 'William King', 'Mary Somerville'],
    charlesFriends: ['William King', 'Mary Somerville', 'Ada Lovelace', 'George Peacock']
  });

  obj.get('friendsInCommon'); // ['William King', 'Mary Somerville']
  ```

  @method intersect
  @for @ember/object/computed
  @static
  @param {String} propertyKey*
  @return {ComputedProperty} computes a new array with all the
  duplicated elements from the dependent arrays
  @public
*/
export function intersect(...args) {
  return multiArrayMacro(
    args,
    function(dependentKeys) {
      let arrays = dependentKeys.map(dependentKey => {
        let array = get(this, dependentKey);
        return isArray(array) ? array : [];
      });

      let results = arrays.pop().filter(candidate => {
        for (let i = 0; i < arrays.length; i++) {
          let found = false;
          let array = arrays[i];
          for (let j = 0; j < array.length; j++) {
            if (array[j] === candidate) {
              found = true;
              break;
            }
          }

          if (found === false) {
            return false;
          }
        }

        return true;
      });

      return emberA(results);
    },
    'intersect'
  );
}

/**
  A computed property which returns a new array with all the
  properties from the first dependent array that are not in the second
  dependent array.

  Example

  ```javascript
  import { setDiff } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let Hamster = EmberObject.extend({
    likes: ['banana', 'grape', 'kale'],
    wants: setDiff('likes', 'fruits')
  });

  let hamster = Hamster.create({
    fruits: [
      'grape',
      'kale',
    ]
  });

  hamster.get('wants'); // ['banana']
  ```

  @method setDiff
  @for @ember/object/computed
  @static
  @param {String} setAProperty
  @param {String} setBProperty
  @return {ComputedProperty} computes a new array with all the
  items from the first dependent array that are not in the second
  dependent array
  @public
*/
export function setDiff(setAProperty, setBProperty) {
  assert('`computed.setDiff` requires exactly two dependent arrays.', arguments.length === 2);
  assert(
    `Dependent keys passed to \`computed.setDiff\` shouldn't contain brace expanding pattern.`,
    !/[\[\]\{\}]/g.test(setAProperty) && !/[\[\]\{\}]/g.test(setBProperty)
  );

  let cp = new ComputedProperty(
    function() {
      let setA = this.get(setAProperty);
      let setB = this.get(setBProperty);

      if (!isArray(setA)) {
        return emberA();
      }
      if (!isArray(setB)) {
        return emberA(setA);
      }

      return setA.filter(x => setB.indexOf(x) === -1);
    },
    {
      dependentKeys: [`${setAProperty}.[]`, `${setBProperty}.[]`],
      readOnly: true,
    }
  );

  return cp;
}

/**
  A computed property that returns the array of values
  for the provided dependent properties.

  Example

  ```javascript
  import { collect } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let Hamster = EmberObject.extend({
    clothes: collect('hat', 'shirt')
  });

  let hamster = Hamster.create();

  hamster.get('clothes'); // [null, null]
  hamster.set('hat', 'Camp Hat');
  hamster.set('shirt', 'Camp Shirt');
  hamster.get('clothes'); // ['Camp Hat', 'Camp Shirt']
  ```

  @method collect
  @for @ember/object/computed
  @static
  @param {String} dependentKey*
  @return {ComputedProperty} computed property which maps
  values of all passed in properties to an array.
  @public
*/
export function collect(...dependentKeys) {
  return multiArrayMacro(
    dependentKeys,
    function() {
      let res = dependentKeys.map(key => {
        let val = get(this, key);
        return val === undefined ? null : val;
      });

      return emberA(res);
    },
    'collect'
  );
}

/**
  A computed property which returns a new array with all the
  properties from the first dependent array sorted based on a property
  or sort function. The sort macro can be used in two different ways:

  1. By providing a sort callback function
  2. By providing an array of keys to sort the array

  In the first form, the callback method you provide should have the following
  signature:

  ```javascript
  function(itemA, itemB);
  ```

  - `itemA` the first item to compare.
  - `itemB` the second item to compare.

  This function should return negative number (e.g. `-1`) when `itemA` should
  come before `itemB`. It should return positive number (e.g. `1`) when `itemA`
  should come after `itemB`. If the `itemA` and `itemB` are equal this function
  should return `0`.

  Therefore, if this function is comparing some numeric values, simple `itemA -
  itemB` or `itemA.get( 'foo' ) - itemB.get( 'foo' )` can be used instead of
  series of `if`.

  Example

  ```javascript
  import { sort } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let ToDoList = EmberObject.extend({
    // using a custom sort function
    priorityTodos: sort('todos', function(a, b){
      if (a.priority > b.priority) {
        return 1;
      } else if (a.priority < b.priority) {
        return -1;
      }

      return 0;
    })
  });

  let todoList = ToDoList.create({
    todos: [
      { name: 'Unit Test', priority: 2 },
      { name: 'Documentation', priority: 3 },
      { name: 'Release', priority: 1 }
    ]
  });

  todoList.get('priorityTodos');    // [{ name:'Release', priority:1 }, { name:'Unit Test', priority:2 }, { name:'Documentation', priority:3 }]
  ```

  You can also optionally pass an array of additional dependent keys as the
  second parameter, if your sort function is dependent on additional values that
  could changes:

  ```js
  import { sort } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let ToDoList = EmberObject.extend({
    // using a custom sort function
    sortedTodos: sort('todos', ['sortKey'] function(a, b){
      if (a[this.sortKey] > b[this.sortKey]) {
        return 1;
      } else if (a[this.sortKey] < b[this.sortKey]) {
        return -1;
      }

      return 0;
    })
  });

  let todoList = ToDoList.create({
    sortKey: 'priority',

    todos: [
      { name: 'Unit Test', priority: 2 },
      { name: 'Documentation', priority: 3 },
      { name: 'Release', priority: 1 }
    ]
  });

  todoList.get('priorityTodos');    // [{ name:'Release', priority:1 }, { name:'Unit Test', priority:2 }, { name:'Documentation', priority:3 }]
  ```

  In the second form, you should provide the key of the array of sort values as
  the second parameter:

  ```javascript
  import { sort } from '@ember/object/computed';
  import EmberObject from '@ember/object';

  let ToDoList = EmberObject.extend({
    // using standard ascending sort
    todosSorting: Object.freeze(['name']),
    sortedTodos: sort('todos', 'todosSorting'),

    // using descending sort
    todosSortingDesc: Object.freeze(['name:desc']),
    sortedTodosDesc: sort('todos', 'todosSortingDesc'),
  });

  let todoList = ToDoList.create({
    todos: [
      { name: 'Unit Test', priority: 2 },
      { name: 'Documentation', priority: 3 },
      { name: 'Release', priority: 1 }
    ]
  });

  todoList.get('sortedTodos');      // [{ name:'Documentation', priority:3 }, { name:'Release', priority:1 }, { name:'Unit Test', priority:2 }]
  todoList.get('sortedTodosDesc');  // [{ name:'Unit Test', priority:2 }, { name:'Release', priority:1 }, { name:'Documentation', priority:3 }]
  ```

  @method sort
  @for @ember/object/computed
  @static
  @param {String} itemsKey
  @param {Array} [additionalDependentKeys] optional array of additional dependent keys
  @param {String or Function} sortDefinition a dependent key to an
  array of sort properties (add `:desc` to the arrays sort properties to sort descending) or a function to use when sorting
  @return {ComputedProperty} computes a new sorted array based
  on the sort property array or callback function
  @public
*/
export function sort(itemsKey, additionalDependentKeys, sortDefinition) {
  if (DEBUG) {
    let argumentsValid = false;

    if (arguments.length === 2) {
      argumentsValid =
        typeof itemsKey === 'string' &&
        (typeof additionalDependentKeys === 'string' ||
          typeof additionalDependentKeys === 'function');
    }

    if (arguments.length === 3) {
      argumentsValid =
        typeof itemsKey === 'string' &&
        Array.isArray(additionalDependentKeys) &&
        typeof sortDefinition === 'function';
    }

    assert(
      '`computed.sort` can either be used with an array of sort properties or with a sort function. If used with an array of sort properties, it must receive exactly two arguments: the key of the array to sort, and the key of the array of sort properties. If used with a sort function, it may recieve up to three arguments: the key of the array to sort, an optional additional array of dependent keys for the computed property, and the sort function.',
      argumentsValid
    );
  }

  if (sortDefinition === undefined && !Array.isArray(additionalDependentKeys)) {
    sortDefinition = additionalDependentKeys;
    additionalDependentKeys = [];
  }

  if (typeof sortDefinition === 'function') {
    return customSort(itemsKey, additionalDependentKeys, sortDefinition);
  } else {
    return propertySort(itemsKey, sortDefinition);
  }
}

function customSort(itemsKey, additionalDependentKeys, comparator) {
  return arrayMacro(itemsKey, additionalDependentKeys, function(value) {
    return value.slice().sort((x, y) => comparator.call(this, x, y));
  });
}

// This one needs to dynamically set up and tear down observers on the itemsKey
// depending on the sortProperties
function propertySort(itemsKey, sortPropertiesKey) {
  let cp = new ComputedProperty(
    function(key) {
      let sortProperties = get(this, sortPropertiesKey);

      assert(
        `The sort definition for '${key}' on ${this} must be a function or an array of strings`,
        isArray(sortProperties) && sortProperties.every(s => typeof s === 'string')
      );

      // Add/remove property observers as required.
      let activeObserversMap = cp._activeObserverMap || (cp._activeObserverMap = new WeakMap());
      let activeObservers = activeObserversMap.get(this);

      let sortPropertyDidChangeMap =
        cp._sortPropertyDidChangeMap || (cp._sortPropertyDidChangeMap = new WeakMap());

      if (!sortPropertyDidChangeMap.has(this)) {
        sortPropertyDidChangeMap.set(this, function() {
          this.notifyPropertyChange(key);
        });
      }

      let sortPropertyDidChange = sortPropertyDidChangeMap.get(this);

      if (activeObservers !== undefined) {
        activeObservers.forEach(path => removeObserver(this, path, sortPropertyDidChange));
      }

      let itemsKeyIsAtThis = itemsKey === '@this';
      let normalizedSortProperties = normalizeSortProperties(sortProperties);
      if (normalizedSortProperties.length === 0) {
        let path = itemsKeyIsAtThis ? `[]` : `${itemsKey}.[]`;
        addObserver(this, path, sortPropertyDidChange);
        activeObservers = [path];
      } else {
        activeObservers = normalizedSortProperties.map(([prop]) => {
          let path = itemsKeyIsAtThis ? `@each.${prop}` : `${itemsKey}.@each.${prop}`;
          addObserver(this, path, sortPropertyDidChange);
          return path;
        });
      }

      activeObserversMap.set(this, activeObservers);

      let items = itemsKeyIsAtThis ? this : get(this, itemsKey);
      if (!isArray(items)) {
        return emberA();
      }

      if (normalizedSortProperties.length === 0) {
        return emberA(items.slice());
      } else {
        return sortByNormalizedSortProperties(items, normalizedSortProperties);
      }
    },
    { dependentKeys: [`${sortPropertiesKey}.[]`], readOnly: true }
  );

  cp._activeObserverMap = undefined;
  cp._sortPropertyDidChangeMap = undefined;

  return cp;
}

function normalizeSortProperties(sortProperties) {
  return sortProperties.map(p => {
    let [prop, direction] = p.split(':');
    direction = direction || 'asc';

    return [prop, direction];
  });
}

function sortByNormalizedSortProperties(items, normalizedSortProperties) {
  return emberA(
    items.slice().sort((itemA, itemB) => {
      for (let i = 0; i < normalizedSortProperties.length; i++) {
        let [prop, direction] = normalizedSortProperties[i];
        let result = compare(get(itemA, prop), get(itemB, prop));
        if (result !== 0) {
          return direction === 'desc' ? -1 * result : result;
        }
      }
      return 0;
    })
  );
}
