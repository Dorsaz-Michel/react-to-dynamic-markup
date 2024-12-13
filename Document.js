export default class Document {
    static #createClassComponent = async (component, props, children) => new component(props, children);
    static #createFunctionComponent = async (component, props, children) => component(props, children);
    /**
     * Set the createClassComponent callback
     *
     * The createClassComponent callback is called whenever a class component is created
     *
     * It can be used by example to add document as second property of any class component created
     *
     * Ex: setClassComponentCallback(async (component, props, children) => component(props, doc, children));
     *
     * Note: It doesn't affect root component ! But you can do it by calling root component as a function when
     * using renderToDynamicMarkup:
     *
     * EX: use: renderToDynamicMarkup(Page({ id: "page"}, document)) instead of: renderToDynamicMarkup(<Page id="page" />)
     *
     */
    static setClassComponentCallback(createComponent) {
        this.#createClassComponent = createComponent;
        return this;
    }
    #identifier = 0; // auto-increment id for generating unique identifiers
    #lang = "en";
    #title = "Rendered as dynamic markup";
    #metas = [];
    #links = [];
    #styles = [];
    #headerScripts = [];
    #bodyScripts = [];
    #referencedHeaderScripts = {};
    #referencedBodyScripts = {};
    #noScript = "Your browser does not support JavaScript!";
    /**
     * The document reflect the DOM, with method to modify information such as lang title, metas, links, scripts...
     *
     * The method renderToDynamicMarkup creates the HTML string including setup script for listeners and doctype, html, head & body tags
     */
    constructor() { }
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
     */
    async renderToDynamicMarkup(reactNode) {
        const content = await this.#renderToString(reactNode);
        const referencedHeaderScripts = [];
        const referencedBodyScripts = [];
        Object.values(this.#referencedHeaderScripts).map(({ attributes, functions, DOMContentLoadedFunctions }) => {
            let content = "\n";
            functions.forEach(fn => content += fn + "\n");
            if (DOMContentLoadedFunctions.length > 0) {
                content += `\n\ndocument.addEventListener("DOMContentLoaded", () => {\n`;
                DOMContentLoadedFunctions.forEach(fn => content += fn + "\n");
                content += `\n})\n`;
            }
            attributes.children = content;
            referencedHeaderScripts.push(this.#parseTag('script', attributes));
        });
        Object.values(this.#referencedBodyScripts).map(({ attributes, functions, DOMContentLoadedFunctions }) => {
            let content = "\n";
            functions.forEach(fn => content += fn + "\n");
            if (DOMContentLoadedFunctions.length > 0) {
                content += `\ndocument.addEventListener("DOMContentLoaded", () => {`;
                DOMContentLoadedFunctions.forEach(fn => content += fn + "\n");
                content += `})\n`;
            }
            attributes.children = content;
            referencedBodyScripts.push(this.#parseTag('script', attributes));
        });
        return `
            <!DOCTYPE html>
            <html lang='${this.#lang}'>
                <head>
                    <title>${this.#title}</title>
                    ${(await Promise.all(this.#metas)).join("\n")}
                    ${(await Promise.all(this.#links)).join("\n")}
                    ${(await Promise.all(this.#styles)).join("\n")}
                    ${(await Promise.all(this.#headerScripts)).join("\n")}
                    ${(await Promise.all(referencedHeaderScripts)).join("\n")}
                </head>
                <body>
                    ${content}
                    ${(await Promise.all(this.#bodyScripts)).join("\n")}
                    ${(await Promise.all(referencedBodyScripts)).join("\n")}
                    <noscript>${this.#noScript}</noscript>
                </body>
            </html>
        `;
    }
    /**
     * Transform React node to HTML string
     */
    async #renderToString(reactNode) {
        if (typeof reactNode === 'string')
            return reactNode;
        if (typeof reactNode === 'number')
            return String(reactNode);
        if (typeof reactNode === "boolean")
            return reactNode ? "true" : "false";
        if (reactNode === undefined)
            return "undefined";
        if (reactNode === null)
            return "null";
        // Array
        if (Symbol.iterator in reactNode) {
            let html = "";
            for (const node of reactNode) {
                html += await this.#renderToString(node);
            }
            return html;
        }
        /*
            ReactElement
         */
        let { type, props = {} } = reactNode;
        if (typeof type === "string")
            return await this.#parseTag(type, props);
        // Manage class components
        if (type.prototype)
            return await this.#renderToString(await Document.#createClassComponent(type, props, props.children));
        // Manage function components
        if (typeof type === 'function') {
            return await this.#renderToString(await Document.#createFunctionComponent(type, props, props.children));
        }
        return "";
    }
    async #parseTag(tag, attributes) {
        let html = `<${tag}`;
        let children = "";
        let eventListeners = [];
        Object.entries(attributes).forEach(([attribute, value]) => {
            if (attribute === "children")
                children = value;
            else {
                if (attribute.toLowerCase().startsWith('on') && typeof value === "function")
                    eventListeners.push({ type: attribute.substring(2).toLowerCase(), listener: value.toString() });
                else if (attribute.toLowerCase() === "style" && typeof value === "object")
                    html += ` style="${Object.entries(value).map(([styleAttribute, styleValue]) => `${styleAttribute}:${styleValue.toString()}`).join(';')}"`;
                else if (typeof value === "boolean") {
                    if (value)
                        html += " " + attribute;
                }
                else if (typeof value !== "symbol") {
                    if (attribute === "className")
                        attribute = "class";
                    html += ` ${attribute}="${value}"`;
                }
            }
        });
        if (eventListeners.length > 0) {
            let identifier = `${tag}_${this.#identifier++}`;
            html += ` data-identifier="${identifier}" data-listeners="${eventListeners.map(eventListener => eventListener.type).join(", ")}"`;
            this.addToScript("listeners", `const ${identifier} = document.querySelector('[data-identifier="${identifier}"]');\n${eventListeners
                .map(eventListener => `${identifier}.addEventListener("${eventListener.type}", ${eventListener.listener});`).join('\n')}`);
        }
        html += `>${await this.#renderToString(children)}</${tag}>`;
        return html;
    }
    /**
     * Set html "lang" attribute
     *
     * Ex: setLang("fr")
     *
     * Result: <html lang='fr'>
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
     * Result: <meta name="keywords" content="HTML, CSS, JavaScript" />
     */
    addMeta(attributes) {
        this.#metas.push(this.#parseTag("meta", attributes));
        return this;
    }
    /**
     * Add header link tag
     *
     * Ex: addLink({href: "main.css", rel: "stylesheet"})
     *
     * Result: <link href="main.css" rel="stylesheet" />
     */
    addLink(attributes) {
        this.#links.push(this.#parseTag("link", attributes));
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
     */
    addStyle(attributes, content) {
        if (content)
            attributes.children = content;
        this.#styles.push(this.#parseTag("style", attributes));
        return this;
    }
    /**
     * Add script tag
     *
     * Note: To add script content, set reference and use addToScript(reference, ...)
     *
     * Ex: addScript("header", { src: "js/vendor/jquery.js", async: true })
     *
     * Result: <head>...<script src="js/vendor/jquery.js" async></script>...</head>
     *
     * Ex: addScript("header", {}, "main"); addToScript("main", () => alert("Hello world"))
     *
     * Result: <script>() => alert("Hello World!")</script>
     */
    addScript(location, attributes, reference) {
        if (reference) {
            attributes['data-reference'] = reference;
            const referenceScripts = location === "header" ? this.#referencedHeaderScripts : this.#referencedBodyScripts;
            if (!referenceScripts[reference])
                referenceScripts[reference] = { attributes, functions: [], DOMContentLoadedFunctions: [] };
        }
        else {
            if (location === "header")
                this.#headerScripts.push(this.#parseTag("script", attributes));
            else
                this.#bodyScripts.push(this.#parseTag("script", attributes));
        }
        return this;
    }
    /**
     * Add content to a script.
     *
     * NOTE: Functions added through this method with waitDomContentLoaded = true share the same DomContentLoaded listener
     *
     * Ex: addToScript("main", function hello() {alert("hello") });
     *
     * Result: <script>function hello() { alert("hello") }</script>
     *
     * Ex: addToScript("main", function hello() { alert("hello") }, true); addToScript("main", function world() { alert("world") }, true);
     *
     * Result: <script>document.addEventListener('DOMContentLoaded', () => { function hello() { alert("hello") } function world() { alert("world") } });</script>
     */
    addToScript(scriptReference, content, waitDomContentLoaded) {
        let script = this.#referencedHeaderScripts[scriptReference] || this.#referencedBodyScripts[scriptReference];
        if (!script) {
            this.#referencedBodyScripts[scriptReference] = { attributes: {}, functions: [], DOMContentLoadedFunctions: [] };
            script = this.#referencedBodyScripts[scriptReference];
        }
        const functions = waitDomContentLoaded ? script.DOMContentLoadedFunctions : script.functions;
        functions.push(typeof content == "function" ? content.toString() : content);
        return this;
    }
    /**
     * Set "no script" tag content
     *
     * Ex: setNoScript("Unable to run scripts !")
     *
     * Result: <noscript>Unable to run scripts !</noscript>
     */
    setNoScript(content) {
        this.#noScript = content;
        return this;
    }
}
