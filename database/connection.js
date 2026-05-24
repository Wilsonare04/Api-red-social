const mongoose = require("mongoose");

const connection = async() => {

    try{
        const dbUrl = process.env.MONGODB_URI || "mongodb://localhost:27017/mi_redsocial";
        await mongoose.connect(dbUrl);

        console.log("Conectado correctamente a la base de datos.");

    } catch(error) {
        console.log(error);
        throw new Error("No se ha podido conectar a la base de datos !!");
    }

}

module.exports = connection;
