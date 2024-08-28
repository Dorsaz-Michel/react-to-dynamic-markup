/*
    import/Documents.js and require/Document.js are the same file, except one has
    "export default" and the other "module.exports ="
    This file allow to update one or the other by doing "npm run update-folder require|import"
    By example doing "npm run update-folder import" will copy require/Documents.js into
    import/Document.js and change the export type.
 */


const folder = process.argv[2];

if (!["import", "require"].includes(folder))
    console.log("Invalid folder, expected 'import' or 'require'");

const fs = require('node:fs');

if (folder === "import") {
    const content = fs.readFileSync("./require/Document.cjs", { encoding: "utf-8" });
    fs.writeFileSync("./import/Document.js", content.replace("module.exports =", "export default"));
}
else {
    const content = fs.readFileSync("./import/Document.js", { encoding: "utf-8" });
    fs.writeFileSync("./require/Document.cjs", content.replace("export default", "module.exports ="));
}




