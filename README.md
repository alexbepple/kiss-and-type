# What is this?

A lightweight approach to typing in plain JavaScript.

More thoughts on typing below.


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

# On types

> Types, huh, yeah!  
> What are they good for?
> 
> _– Edwin Starr_

I just thought of this and it made me laugh. It is not my actual position on types. Nor is it Edwin Starr’s.

So what are types good for? A few things come to mind immediately.

* Autocompletion (simple tooling)
* Refactoring (advanced tooling) – Nothing in the JS world (nor even in the TS world at the moment) comes even close to what an IDE can do to Java safely.
* Documentation
* Type safety

When we discuss types in the broader JS ecosystem, in my perception, we talk almost exclusively only about these aspects. These are all valuable things to have. They are not free, however. I generally agree with Eric Elliott regarding the Type(Script) Tax. Loosely summarized: 1) JS tooling isn’t too bad; 2) if you practice TDD and code reviews, type safety does not save you from too many additional bugs; 3) the cost of working with TS types is greater than the incremental advantages of TS over JS.

But wait, there is more. Nevermind structural typing. Either way, we need a place where to put the behavior of our things. As our things grow and can do more things, we naturally put related behavior close to each other and unrelated behavior farther away. As we build cohesive modules, we naturally build types.

This has always been my main motivation for types. More importantly, I naturally gravitated towards building types in this sense in JS, a language that does not exactly force such constructs on you. When building cohesive behavior, of course, you also access the same properties time and time again. This coincided with the desire for a simple way to encapsulate property access in JS.

The desire for a property-access mechanism in JS came from the wish for some safety. This became a major concern for me when one of the teams that I have worked with was writing quite a few tests just in order to guard itself against mistyping property names. It gave Flow a try, but found the type tax too high. – I also wanted to be able to progressively enhance the property access.

Finally, because of an intensive use of Ramda, functional composition became a major concern.

The marriage of these three – behavior honeypot, property access and FP – led me to this type construct.

I use `createType` to scaffold the property access. I then add interesting behavior as it emerges.
