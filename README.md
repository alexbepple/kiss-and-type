# What is this?

A lightweight approach to typing in plain JavaScript.


# Features

## Some safety

```javascript
> fooT = createType([ 'bar' ])
…
> fooT.get.baz({})
Thrown:
TypeError: fooT.get.baz is not a function
```

## Immutable

By default, all operations are immutable.
However, immutability is not enforced in any fashion on the objects.

```javascript
> fooT = createType(['bar'])
…
> foo1 = fooT.set.bar(0)({})
{ bar: 0 }
> foo2 = fooT.set.bar(1)(foo1)
{ bar: 1 }
> foo1
{ bar: 0 }
```

## Functional programming

### Composition

All operations are functions that need no binding and thus lend themselves perfectly for functional composition.

```javascript
> fooT = createType([ 'bar' ])
> r.pipe(
  () => [ null, {}, { bar: 0 }, fooT.objOf.bar(1) ],
  r.filter(fooT.has.bar),
  fooT.pluck.bar
)()
[ 0, 1 ]
```

### Familiar lingo

`objOf`, `has` and `pluck` in the above example are derived from Ramda lingo.

So are `pick`, `eq`, `over`.


## Aliases

In practice we have found it very helpful to define aliases for props. 
* Under some circumstances the cost for a deep rename might be too high. 
* Or you might be unable to change the prop name at all, e.g. when using an external API. 
* Or you might actually want to have both, a simple name and a very precise one. Say you have a prop called `f72OriginalClosingDay`. This name is very precise in the domain of Schlussnoten and we might want to keep it for reference. At the same time, it is a pain to use. So we might want to alias it to `originalClosing`.

```javascript
> fooT = createType([ {someVeryLongAndOrCumbersomeName: { alias: 'bar' }} ])
…
> foo = fooT.set.someVeryLongAndOrCumbersomeName(0)({})
{ someVeryLongAndOrCumbersomeName: 0 }
> fooT.get.bar(foo)
0
```

## Progressive enhancement

You get getters and setters out of the box. If you want, you can enhance them.

```javascript
> fooT = createType([ {bar: { get: r.defaultTo(0) }} ])
…
> fooT.get.bar({})
0
```

```javascript
> fooT = createType([ {bar: { set: Math.floor }} ])
…
> fooT.set.bar(0.5)({})
{ bar: 0 }
```

## Relationships between types

Interfaces, inheritance, mixins are largely unexplored at the moment. The value of this approach to typing seems to lie elsewhere, either way.


# API

```javascript
> fooT = createType([ 'bar' ])
{
  props: { bar: [Function] },
  get: { bar: [Function: f1] },
  pick: { bar: [Function] },
  pluck: { bar: [Function: f1] },
  has: { bar: [Function] },
  eq: { bar: [Function] },
  set: { bar: [Function: f2] },
  objOf: { bar: [Function] },
  over: { bar: [Function: f2] }
}
```
