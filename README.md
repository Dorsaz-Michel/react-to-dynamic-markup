# react-to-dynamic-markup
Tools to transform a React element into a valid HTML string which includes a setup script for listeners (server-side hydration).

This project aim to provide an alternative to React method renderToStaticMarkup, which would allow to generate dynamic markup on the server.

## Important notes about react-to-dynamic-markup

### It's not a React library
The tools allow to generate HTML from a React node, but React methods (such as useEffect, useRef, ...) won't works ! It's not a React library, only tranforming JSX to React node and parsing it.

### HTML is server-side generated
Server variables won't be recognised if referenced in a client method ! By exemple :

```
const serverVariable = "Hello from server";
return <button onClick={() => console.log(serverVariable)}>Click me</button>
```
Will result in :

```
<button data-identifier="button_0" data-listeners="click">Click me</button>
...
<script>
  document.addEventListener('DOMContentLoaded', function() {
    const button_0 = document.querySelector('[data-identifier="button_0"]');
    button_0.addEventListener('click', () => console.log(serverVariable));
  });
</script>
```

Notice how the `const serverVariable = "Hello from server";` is not present on the client side, resulting in reference error when clicking the button !

You must pass the reference to the client manually, by exemple using data-x :

```
const serverVariable = "Hello from server";
return <button data-server-variable={serverVariable} onClick={(event) => console.log(event.target.getAttribute('data-server-variable'))}>Click me</button>
```

## Why using react-to-dynamic-markup
If you like React JSX notation but don't want to go full React and you want to do server-side rendering with your framework (ex: Express.js) but you just want to directly convert JSX to HTML without having to do client-side hydration.

## Exemple how to use react-to-dynamic-markup
```
npm install express react react-dom
npm install --save-dev @babel/core @babel/preset-env @babel/preset-react babel-loader
npm install git+https://github.com/Dorsaz-Michel/react-to-dynamic-markup.git#main
```

.babelrc
```
{
  "presets": ["@babel/preset-env", "@babel/preset-react"]
}
```

.babel-register.js
```
require('@babel/register')({
    presets: ['@babel/preset-react']
});
```

server.js
```
const express = require("express");
const {renderToStaticMarkup} = require("react-dom/server");
const React = require("react");
const app = express();
const Document = require("render-to-dynamic-markup");

const Page = require('./Page'); // Importer le composant React

app.use('/renderToStaticMarkup', async (request, response) => {
    const html = renderToStaticMarkup(<Page />);
    response.send(html);
});

app.use('/renderToDynamicMarkup', async (request, response) => {

    doc = new Document();

    doc
        .setTitle("Hello world")
        .setLang("fr")
        .addMeta({name: "keywords", content: "HTML, CSS, JavaScript"})
        .addLink({href: "main.css", rel: "stylesheet"})
        .addStyle({}, "h1 {color: #26b72b;} code {font-weight: bold;}")
        .addHeaderScript({ src: "js/vendor/jquery.js", async: true })
        .addHeaderScript({}, () => console.log("Hello World!"))
        .addBodyScript({ src: "js/vendor/jquery.js", async: true })
        .addBodyScript({}, () => console.log("Hello World!"))
        .setNoScript("Unable to run scripts !")
    
    const html = await doc.renderToDynamicMarkup(<Page/>, );
    response.send(html);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
```

index.js
```
require('./babel-register'); // Charger Babel pour JSX
const React = require('react');

require("./app.js");
```

Page.js
```
const React = require("react");

const Page = () => (
    <>
        <h1>Hello, World!</h1>
        <button onClick={() => alert("hello world !")}>Click me</button>
    </>

);

module.exports = Page;
```

Resulting HTML :
```
<!DOCTYPE html>
<html lang='fr'>
    <head>
        <title>Hello world</title>
        <meta name="keywords" content="HTML, CSS, JavaScript"></meta>
        <link href="main.css" rel="stylesheet"></link>
        <style >h1 {color: #26b72b;} code {font-weight: bold;}</style>
        <script src="js/vendor/jquery.js" async></script>
        <script >document.addEventListener('DOMContentLoaded', () => console.log("Hello World!"));</script>
    </head>
    <body>
        <h1>Hello, World!</h1><button data-identifier="button_0" data-listeners="click">Click me</button>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            const button_0 = document.querySelector('[data-identifier="button_0"]');
            button_0.addEventListener("click", () => alert("hello world !"));
          });
        </script>
        <script src="js/vendor/jquery.js" async></script>
        <script >document.addEventListener('DOMContentLoaded', () => console.log("Hello World!"));</script>
        <noscript>Unable to run scripts !</noscript>
    </body>
</html>
```

### Advanced feature: setCreateComponentCallback
After creating a document you can use the setCreateComponentCallback function. That may be helpfull if you do custom JSX component properties.

Let say you want to pass the document itself as the second argument to any JSX component, to allow components to edit the document:

```
const Logger = require("myLogger");

const logger = new Logger();

const doc = new Document();
doc.setCreateComponentCallback(async (component, props) => component(props, doc));
...
```

And in a JSX file you can define the component as :

```
const React = require("react");

const Page = (props, document) => {
  document.setLang("fr");

  return <>
        <h1>Hello, World!</h1>
        <button onClick={() => alert("hello world !")}>Click me</button>
    </>
}

module.exports = Page;
```


## What's up behind the scene
A custom algorithm to parse a React node into an HTML string.

Attributes starting with "on" and having a value of type "function" will be registered as eventListeners. Resulting HTML contain a listener setup script which include a method addEventListener for each of the registred eventListeners.

Properties key and ref from a React element are ignored.
