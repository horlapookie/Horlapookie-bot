

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
    
    // Create wrapper execute function that converts standard parameters to horla format
    infoComs.execute = async (msg, { sock, args, settings }) => {
        // Validate msg structure
        if (!msg || !msg.key || !msg.key.remoteJid) {
            console.error('[HORLA] Invalid message object received');
            return;
        }
        
        const from = msg.key.remoteJid;
        
        // Create commandeOptions in the format horla functions expect
        const commandeOptions = {
            repondre: async (text) => {
                await sock.sendMessage(from, { text }, { quoted: msg });
            },
            ms: msg,
            arg: args || [],
            sock: sock,
            settings: settings
        };
        
        // Call the original function with proper horla-style parameters
        // Note: The horla functions in logo.js expect (msg, { sock, args }) format
        // So we need to call them with the standard format, not the old horla format
        return await fonctions(msg, { sock, args, settings });
    };
    
    infoComs.fonction = fonctions;
    cm.push(infoComs);
    return infoComs;
}

export { horla, horla as Module, cm };