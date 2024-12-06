import {ReactElement} from "react";

export default class Document {
    /**
     * The document reflect the DOM, with method to modify information such as lang title, metas, links, scripts...
     *
     * The method renderToDynamicMarkup creates the HTML string including setup script for listeners and doctype, html, head & body tags
     */
    constructor()

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
    renderToDynamicMarkup(reactElement: ReactElement) : Promise<string>


    /**
     * Set the createComponent callback
     *
     * The createComponent callback is called whenever a component is created
     *
     * It can be used by example to add document as second property of any component created
     *
     * Ex: setCreateComponentCallback(async (component, props, children) => component(props, doc, children));
     *
     * Note: It doesn't affect root component ! But you can do it by calling root component as a function when
     * using renderToDynamicMarkup:
     *
     * EX: use: renderToDynamicMarkup(Page({ id: "page"}, document)) instead of: renderToDynamicMarkup(<Page id="page" />)
     *
     * @param {(component:Object, props:Object, children?:Object) => Promise<Object>} createComponent
     */
    setCreateComponentCallback(createComponent: (component: Function, props: Object, children?:ReactElement) => ReactElement|Promise<ReactElement>) : this

    /**
     * Set html "lang" attribute
     *
     * Ex: setLang("fr")
     *
     * Result: <html lang='fr'>
     * @param {string} lang
     */
    setLang(lang: string) : this

    /**
     * Set document's title
     *
     * Ex: setTitle("Hello")
     *
     * Result: <title>Hello</title>
     * @param {string} title
     */
    setTitle(title: string) : this

    /**
     * Add header meta tag
     *
     * Ex: addMeta({name: "keywords", content: "HTML, CSS, JavaScript"})
     *
     * Result: <meta name="keywords" content="HTML, CSS, JavaScript" />
     * @param {{[p:string]: string|boolean}} attributes
     */
    addMeta(attributes: {[p:string]: string|boolean}) : this

    /**
     * Add header link tag
     *
     * Ex: addLink({href: "main.css", rel: "stylesheet"})
     *
     * Result: <link href="main.css" rel="stylesheet" />
     * @param {{[p:string]: string|boolean}} attributes
     */
    addLink(attributes: {[p:string]: string|boolean}): this

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
     * @param {string?} content
     */
    addStyle(attributes: {[p:string]: string|boolean}, content?: string): this

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
     *
     * Ex: addHeaderScript({}, () => alert("Hello World!"), false)
     *
     * Result: <script>() => alert("Hello World!")</script>
     * @param {{[p:string]: string|boolean}} attributes
     * @param {Function|string|undefined} content
     * @param {boolean?} waitDomContentLoaded
     */
    addHeaderScript(attributes: {[p:string]: string|boolean}, content?: Function|string, waitDomContentLoaded?: boolean): this

    /**
     * Add body script (at the end of the body, before the listeners)
     *
     * Ex: addBodyScript({ src: "js/vendor/jquery.js", async: true })
     *
     * Result: <script src="js/vendor/jquery.js" async></script>
     *
     * Ex: addBodyScript({}, () => alert("Hello World!"))
     *
     * Result: <script>document.addEventListener('DOMContentLoaded', () => alert("Hello World!"));</script>
     *
     * Ex: addBodyScript({}, () => alert("Hello World!"), false)
     *
     * Result: <script>() => alert("Hello World!")</script>
     * @param {{[p:string]: string|boolean}} attributes
     * @param {Function|string|undefined} content
     * @param {boolean?} waitDomContentLoaded
     */
    addBodyScript(attributes: {[p:string]: string|boolean}, content?: Function|string, waitDomContentLoaded?: boolean): this

    /**
     * Set "no script" tag content
     *
     * Ex: setNoScript("Unable to run scripts !")
     *
     * Result: <noscript>Unable to run scripts !</noscript>
     * @param {string} content
     */
    setNoScript(content: string) : this
}