try{
    const app = require("../backend/src/server.js");
    module.exports = app;
} catch(error){
    console.error("Erro na importação do vercel", error);
};