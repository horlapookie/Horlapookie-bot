

var tabCmds = [];
let cm = [];

function horla(obj, fonctions) {
    let infoComs = obj;
    if (!obj.categorie) {
        infoComs.categorie = "General";
    }
    if (!obj.reaction) {
        infoComs.reaction = "🗂️";
    }
    // Support both 'nomCom' and 'name' for command names
    if (obj.nomCom && !obj.name) {
        infoComs.name = obj.nomCom;
    }
    infoComs.fonction = fonctions;
    infoComs.execute = fonctions; // Add execute for compatibility
    cm.push(infoComs);
    return infoComs;
}

export { horla, horla as Module, cm };