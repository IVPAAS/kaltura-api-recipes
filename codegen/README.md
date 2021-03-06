# Kaltura Sample Code Generation
This directory contains resources for generating sample code for the
[Kaltura client librarires](https://developer.kaltura.com/api-docs/Client%20Libraries).

It currently supports
* JavaScript
* NodeJS
* Ruby
* PHP
* C#
* Python
* Java

## Overview
The Kaltura API is defined by an XML schema that sets out 

1. a set of objects (e.g. a KalturaMediaEntry)
2. a set of services (e.g. the `media` service)
3. a set of operations that can be performed on each service (e.g. `media->list`, `media->add`).

The Kaltura client libraries in each language are generated by ingesting this XML schema,
as are the code snippets created here. Each code template takes in a service, an action,
and any user input, and generates working sample code.

## Adding Languages
Adding a language consists of two steps:

1. **Writing a code template** - this provides the general structure of code snippets for the language
2. **Specifying language syntax** - this informs the `codegen` helper on how to declare and initialize variables

Also be sure to add your language to `CodeTemplates.LANGUAGES` in `./codegen/index.js`.

You can see [this commit](https://github.com/kaltura/kaltura-api-recipes/commit/5e05bb02952facd3afc6aa5cc7693b4ad135380e),
which adds Python support, for a minimal example of what it takes to add a new language.

### Code Templates
Code templates are written in [EJS](http://www.embeddedjs.com/), or embedded javascript.
Templates are contained in `./codegen/templates/{language_name}.ejs.{extension}`.
For a pseudocode language, the code template might look something like this:

```
<% if (showSetup) { -%>
import Kaltura from './lib/kaltura'
client = new Kaltura.client()
client.session.start(<%- codegen.constant(answers.secret) %>,
                     <%- codegen.constant(answers.partnerId) %>)
<% } // endif -%>

<% parameters.forEach(param => { -%>
<%- codegen.assignment(param, [], answers) %>
<% }) // end forEach -%>

<% var parameterNames = parameters.map(p => p.name) -%>
result = client.<%- service %>.<%- action %>(<%- parameterNames.join(', ') %>)
print(result)
```

which, for `media->list`, `showSetup==true`, and answers `{pager[pageSize]: 10, filter[entryId]: '1_xyz'}`
would generate the code:
```
import Kaltura from './lib/kaltura'
client = new Kaltura.client()
client.session.start("abcde",
                     12345);

filter = new Kaltura.MediaEntryFilter({
  entryId: '1_xyz',
});
pager = new Kaltura.FilterPager({
  pageSize: 10,
})

result = client.media.list(filter, pager)
print(pager)
```

#### Template Syntax
The (simplified) rules are these:
* Anything not in `<% %>` brackets is copied literally
* Brackets with a minus sign in back, i.e. `<% -%>` will be evaluated as JavaScript code, and won't affect output
    * e.g. `<% var foo = 'bar' -%>` will create local variable foo, but not print anything to the resulting code snippet
* Brackets with a minus sign in front, i.e. `<%- %>` will evaulate the statement inside the brackets and print the result to the code snippet
    * e.g. `<%- 2 + 2 %>` will print "4" to the resulting code snippet

(side note: the "minus sign in back" is to remove line breaks - see [here](https://github.com/mde/ejs) for the full set of templating rules)

For example
```
<% var foo = 'bar' -%>
console.log(<%- foo %>);
```
will generate:
```
console.log(bar);
```

#### Code Template Input
Each code template has access to the following variables:
* `service` - the name of the Kaltura service being used, e.g. `media`.
* `action` - the name of the action to be performed on that service, e.g. `list` or `add`.
* `parameters` - a list of top-level parameters on that action, e.g. `filter` for `media.list`.
* `answers` - key/value pairs for the user's input (i.e. forms inside recipes or the API console), e.g. `answers.partnerId` will usually contain the partnerId for the logged-in user.
* `showSetup` - whether or not to show "setup" code, e.g. library imports and authentication code
* `codegen` - a set of codegen utilities, informed by the language's syntax specification (see below)
    * `codegen.indent(code, numSpaces)` - will indent each line in `code`
    * `codegen.constant(literal)` - translates a value (e.g. the number `2` or the string `hello "world"`) to the string of code that declares it as a constant in this language (e.g. `2`, `"hello \"world\""`)
    * `codegen.assignment(parameter, parents, answers)` - declares and initializes a variable for a given parameter (i.e. from `parameters` above) according to the values in `answers`. `parents` should be an empty array.

#### Setup Files
Sometime's it's helpful to break setup code out into a separate file, as is done
for JavaScript and NodeJS. You can specify a setup template by adding the file

`./codegen/templates/{language_name}_setup.ejs.{extension}`

This file has access to all the input variables above, plus a variable `code` that contains
the string of code generated by the language's normal template.

For example, here's part of `node_setup.ejs.js`:

```js
client.session.start(function(ks) {
  if (ks.code && ks.message) {
    console.log('Error starting session', ks);
  } else {
    client.setKs(ks);
<%- codegen.indent(code, 4) %>
  }
})
```

### Syntax Specification
The codegen utilities above have a lot going on under the hood. E.g. `assignment` is usually
initializing a complex datatype, such as a `KalturaMediaEntry`. You can customize codegen behavior
for a given language using the `language_opts` object in `index.js`:

```
ext: '',               // File extension for this language, e.g. ".php"
accessor: '.',         // How to get from a Kaltura object to one it's variables
statementPrefix: '',   // Anything that should be placed before a statement
statementSuffix: '',   // Anything that should be placed after a statement (e.g. a semicolon)
objPrefix: '',         // What goes before instantiation of a new Kaltura object (e.g. 'new ')
objSuffix: '',         // What goes after instatiation of a new Kaltura object (e.g. '()')
enumPrefix: '',        // A prefix to place before all Kaltura enums
enumAccessor: '',      // If different from accessor, how to get from the name of a Kaltura enum to one of its members
declarationPrefix: '', // A prefix to use when declaring new variables (e.g. 'var ')
rewriteVariable: function(name) {},  // e.g. to change camel case to underscore
```

For example, here's PHP's specification:
```
php: {
  ext: 'php',
  accessor: '->',
  statementPrefix: '$',
  statementSuffix: ';',
  objPrefix: 'new ',
  objSuffix: '()',
  enumAccessor: '::',
},
```

You can also use `language_opts` to override `codegen.constant`, `codegen.assignment`, or pass
additional helper functions to your template.

## Running Tests
```
npm install -g mocha
mocha
```

will generate code snippets in `./test/golden/`. You should manually check that the code generated
there runs properly.
