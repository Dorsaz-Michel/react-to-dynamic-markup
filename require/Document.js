

module.exports = class Document {

    #identifier = 0; // auto-increment id for generating unique identifiers

    #lang = "en";
    #title = "Rendered as dynamic markup";
    #metas = [];
    #links = [];
    #styles = [];
    #headerScripts = [];
    #bodyScripts = [];
    #noScript = "Your browser does not support JavaScript!";
    #listeners = [];

    #createComponent = async (component, props) => component(props);

    /**
     * The document reflect the DOM, with method to modify information such as lang title, metas, links, scripts...
     *
     * The method renderToDynamicMarkup creates the HTML string including setup script for listeners and doctype, html, head & body tags
     */
    constructor() {}



    /**
     * Transform a React element into a valid HTML string which includes a setup script for listeners (no client-side hydration)
     *
     * Ex: const html = await renderToDynamicMarkup(<Page/>);
     *
     * NOTE: doctype, html, head and body tags will be automatically wrapped and should not be part of the React element !
     *
     * The following methods can be used before calling renderToDynamicMarkup to modify the resulting html:
     * <ul>
     *   <li>setLang</li>
     *   <li>setTitle</li>
     *   <li>addMeta</li>
     *   <li>addLink</li>
     *   <li>addStyle</li>
     *   <li>addHeaderScript</li>
     *   <li>addBodyScript</li>
     *   <li>setNoScript</li>
     * </ul>
     *
     *
     * @param reactElement
     * @return {Promise<string>}
     */
    async renderToDynamicMarkup(reactElement) {

        return `
            <!DOCTYPE html>
            <html lang='${this.#lang}'>
                <head>
                    <title>${this.#title}</title>
                    ${this.#metas.join("\n")}
                    ${this.#links.join("\n")}
                    ${this.#styles.join("\n")}
                    ${this.#headerScripts.join("\n")}
                </head>
                <body>
                    ${await this.#renderToString(reactElement)}
                    <script>
document.addEventListener('DOMContentLoaded', function() {
${this.#listeners.join('\n\n')}
});
                    </script>
                    ${this.#bodyScripts.join("\n")}
                    <noscript>${this.#noScript}</noscript>
                </body>
            </html>
        `;

    }

    /**
     * Transform React element to HTML string
     * @param element
     * @return {Promise<string|string|*|string>}
     */
    async #renderToString(element) {

        if (element === undefined)
            return "undefined";
        if (element === null)
            return "null";
        if (typeof element === 'string' || typeof element === 'number')
            return String(element);


        let html = "";

        if (element instanceof Array) {
            for (const el of element) {
                html += await this.#renderToString(el);
            }
            return html;
        }


        let { type, props = {} } = element;

        // Manage functional components
        if (typeof type === 'function') {
            if (props.children)
                props.children = await this.#renderToString(props.children);

            return await this.#renderToString(await this.#createComponent(type, props));
        }


        if (typeof type !== "symbol")
            html += `<${type}`;


        let children = [];
        const eventListeners = [];
        Object.entries(props).forEach(([key, value]) => {
            if (key === "children")
                children = value;
            else if (key.toLowerCase().startsWith('on') && typeof value === "function")
                eventListeners.push({ type: key.substring(2).toLowerCase(), listener: value.toString()})
            else {
                if (key === "className")
                    key = "class";

                html += ` ${key}="${value}"`;
            }
        })

        if (typeof type !== "symbol" && eventListeners.length > 0) {

            let identifier = `${type}_${this.#identifier++}`;

            html += ` data-identifier="${identifier}" data-listeners="${eventListeners.map(eventListener => eventListener.type).join(", ")}"`;

            this.#listeners.push(
                `const ${identifier} = document.querySelector('[data-identifier="${identifier}"]');\n${eventListeners
                    .map(eventListener => `${identifier}.addEventListener("${eventListener.type}", ${eventListener.listener});`).join('\n')}`
            );
        }

        if (typeof type !== "symbol")
            html += ">";

        for (const child of children)
            html += await this.#renderToString(child);

        if (typeof type !== "symbol")
            html += `</${type}>`;


        return html;
    }

    /**
     * Set the createComponent callback
     *
     * The createComponent callback is called whenever a component is created
     *
     * Ex: setCreateComponentCallback(async (component, props) => component(props));
     *
     * @param {(component:Object, props:Object) => Promise<Object>} createComponent
     */
    setCreateComponentCallback(createComponent) {
        this.#createComponent = createComponent;
        return this;
    }

    /**
     * Set html "lang" attribute
     *
     * Ex: setLang("fr")
     *
     * Result: <html lang='fr'>
     * @param {string} lang
     */
    setLang(lang) {
        this.#lang = lang;
        return this;
    }

    /**
     * Set document's title
     *
     * Ex: setTitle("Hello")
     *
     * Result: <title>Hello</title>
     * @param {string} title
     */
    setTitle(title) {
        this.#title = title;
        return this;
    }

    /**
     * Add header meta tag
     *
     * Ex: addMeta({name: "keywords", content: "HTML, CSS, JavaScript"})
     *
     * Result: <meta name="keywords" content="HTML, CSS, JavaScript">
     * @param {{[p:string]: string|boolean}} attributes
     */
    addMeta(attributes) {
        this.#metas.push(`<meta ${Object.entries(attributes).map(([key, value]) => {
            if (value === true)
                return key;
            else
                return `${key}="${value}"`;
        }).join(' ')}/>`);

        return this;
    }

    /**
     * Add header link tag
     *
     * Ex: addLink({href: "main.css", rel: "stylesheet"})
     *
     * Result: <link href="main.css" rel="stylesheet" />
     * @param {{[p:string]: string|boolean}} attributes
     */
    addLink(attributes) {
        this.#links.push(`<link ${Object.entries(attributes).map(([key, value]) => {
            if (value === true)
                return key;
            else
                return `${key}="${value}"`;
        }).join(' ')}/>`);

        return this;
    }

    /**
     * Add header style tag
     *
     * Ex: addStyle({}, "p {color: #26b72b;} code {font-weight: bold;}")
     *
     * Result: <style>p {color: #26b72b;} code {font-weight: bold;}</style>
     *
     * Ex: addStyle({ media: "all and (max-width: 500px)"}, "p {color: #26b72b;} code {font-weight: bold;}")
     *
     * Result: <style media="all and (max-width: 500px)">p {color: #26b72b;} code {font-weight: bold;}</style>
     * @param {{[p:string]: string|boolean}} attributes
     * @param {string} content
     */
    addStyle(attributes, content = "") {
        this.#styles.push(`<style ${Object.entries(attributes).map(([key, value]) => {
            if (value === true)
                return key;
            else
                return `${key}="${value}"`;
        }).join(' ')}>${content}</style>`);

        return this;
    }

    /**
     * Add header script
     *
     * Ex: addHeaderScript({ src: "js/vendor/jquery.js", async: true })
     *
     * Result: <script src="js/vendor/jquery.js" async></script>
     *
     * Ex: addHeaderScript({}, () => alert("Hello World!"))
     *
     * Result: <script>document.addEventListener('DOMContentLoaded', () => alert("Hello World!"));</script>
     * @param {{[p:string]: string|boolean}} attributes
     * @param {Function} content
     */
    addHeaderScript(attributes, content = null) {

        let scriptContent = "";

        if (typeof content === "function")
            scriptContent = `document.addEventListener('DOMContentLoaded', ${content.toString()});`;


        this.#headerScripts.push(`<script ${Object.entries(attributes).map(([key, value]) => {
            if (value === true)
                return key;
            else
                return `${key}="${value}"`;
        }).join(' ')}>${scriptContent}</script>`);

        return this;
    }

    /**
     * Add body script
     *
     * Ex: addBodyScript({ src: "js/vendor/jquery.js", async: true })
     *
     * Result: <script src="js/vendor/jquery.js" async></script>
     *
     * Ex: addBodyScript({}, () => alert("Hello World!"))
     *
     * Result: <script>document.addEventListener('DOMContentLoaded', () => alert("Hello World!"));</script>
     * @param {{[p:string]: string|boolean}} attributes
     * @param {Function} content
     */
    addBodyScript(attributes, content = null) {

        let scriptContent = "";

        if (typeof content === "function")
            scriptContent = `document.addEventListener('DOMContentLoaded', ${content.toString()});`;


        this.#bodyScripts.push(`<script ${Object.entries(attributes).map(([key, value]) => {
            if (value === true)
                return key;
            else
                return `${key}="${value}"`;
        }).join(' ')}>${scriptContent}</script>`);

        return this;
    }

    /**
     * Set "no script" tag content
     *
     * Ex: setNoScript("Unable to run scripts !")
     *
     * Result: <noscript>Unable to run scripts !</noscript>
     * @param {string} content
     */
    setNoScript(content) {
        this.#noScript = content;
        return this;
    }
}

