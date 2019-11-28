[![npm version](https://img.shields.io/npm/v/kiss-and-type.svg)](https://www.npmjs.com/package/kiss-and-type)


# What is this?

A lightweight approach to typing in plain JavaScript.

You might enjoy some advantages of more common type systems without the need to change your language and tooling. You might enjoy some unexpected advantages as well.


# Features

Let’s look at the practical aspects first. – If you are really interested, more general and slightly deeper thoughts on typing are [further down](#on-types).


## Some safety

```javascript
> fooT = createType([ 'bar' ])
…
> fooT.get.baz
Thrown:
TypeError: Unknown property 'baz'
…
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

### Data-last and curried

```javascript
> fooT = createType([ 'bar' ])
…
> fooT.set.bar(0, {})
{ bar: 0 }
> fooT.set.bar(0)({})
{ bar: 0 }
>
```


### Composition

All functions need no binding and thus lend themselves perfectly for functional composition.

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

`objOf`, `has` and `pluck` in the above example are inspired by [Ramda](https://ramdajs.com/) lingo.

So are `pick`, `pickAll`, `eq`, `over`.


## Aliases

In practice I have found it very helpful to define aliases for props. 
* Under some circumstances the cost for a deep rename might be too high. 
* Or you might be unable to change the prop name at all, e.g. when using an external API. 
* Or you might actually want to have both, a simple name and a very precise one. Say you have a prop called `f72OriginalClosingDay`. This name is very precise in the domain of [Schlussnoten](https://de.wikipedia.org/wiki/Schlussnote) and we might want to keep it for reference. At the same time, it is a pain to use. So we might want to alias it to `originalClosing`.

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

Please refer to the [living doc](./src/living.doc.test.js) for details and examples. Should anything be unclear, kindly open an issue, or even a PR.


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

When we discuss types in the broader JS ecosystem, in my perception, we talk almost exclusively only about these aspects. These are all valuable things to have. They are not free, however. I generally agree with Eric Elliott regarding the [Type(Script) Tax](https://medium.com/javascript-scene/the-typescript-tax-132ff4cb175b). Loosely summarized: 1) JS tooling isn’t too bad[<sup>1</sup>](#1); 2) if you practice TDD and code reviews, type safety does not save you from too many additional bugs; 3) the cost of working with TS types is greater than the incremental advantages of TS over JS.

But wait, there is more. Nevermind structural typing. We need a place where to put the behavior of our things. As our things grow and can do more, we naturally put related behaviors close to each other and unrelated behaviors farther away. As we build cohesive modules, we naturally build types.

This has always been my main motivation for types. More importantly, I naturally gravitated towards building types in this sense in JS, a language that does not exactly force such constructs on you. When building cohesive behavior, of course, you also access the same properties time and time again. 

This coincided with the desire for a simple way to encapsulate property access. It was driven by the wish for some safety. This became a major concern for me when a team that I was working with was writing quite a few tests just in order to guard itself against mistyping property names. The team gave [Flow](https://flow.org/) a try, but found the type tax too high. – I also wanted to be able to progressively enhance the property access.

Finally, because of an intensive use of [Ramda](https://ramdajs.com/), functional composition became a major concern.

The marriage of these three – behavior honeypot, property access and FP – led me to this type construct.

I use `createType` to scaffold the property access. I then add interesting behavior as it emerges.


## Footnotes

1. <a class="anchor" id="1"></a> 
On [episode #90 of JS Party](https://changelog.com/jsparty/90#transcript-64), Chris Hiller shared how he used TS tooling with JSDoc in order to type-check plain JS. I have not tried this. But it sounds as if you could get most advantages of TS’s type checking without switching to TS. See also <https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html>.


# What’s with the name?

[“Keep it simple stupid”](https://en.wikipedia.org/wiki/KISS_principle) came to mind immediately when I started looking for a name. There is a distinct lack of sophistication to this approach. Yet, it is useful. – So, “KISS” and “type” where there. I liked the association of “kiss and tell”. So I kept it.

Added bonus: 😽 and type.


# Thanksgiving

* Abelson & Sussman for [“Structure and Interpretation of Computer Programs”](https://en.wikipedia.org/wiki/Structure_and_Interpretation_of_Computer_Programs). Polaris.
* [Leonie Dreschler-Fischer](https://www.inf.uni-hamburg.de/inst/ab/sav/people/dreschler.html) at the University of Hamburg for introducing me to FP.
* [Ramda](https://ramdajs.com/) for making FP practical in JS.
* My colleagues in the recent years, who supported me in exploring FP and in developing this approach to typing.


# Hacking

* `yarn run check` lints and runs tests

Typical concerns

* semantics: use enhancer or not?
** hypothesis: in most cases probably yes
