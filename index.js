// Cargar variables de entorno
require("dotenv").config();

// Importar dependencias
const connection = require("./database/connection");
const express = require("express");
const cors = require("cors");

// Mensaje bienvenida
console.log("API NODE para RED SOCIAL arrancada!!");

// Conexion a bbdd
connection();

// Crear servidor node
const app = express();
const puerto = process.env.PORT || 3900;

// Asegurar que las carpetas de subida existan en producción
const fs = require("fs");
const path = require("path");
const carpetas = [
  path.join(__dirname, "uploads"),
  path.join(__dirname, "uploads", "avatars"),
  path.join(__dirname, "uploads", "publications")
];
carpetas.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configurar cors
app.use(cors());

// Convertir los datos del body a objetos js
app.use(express.json());
app.use(express.urlencoded({extended: true})); 

// Servir la carpeta de subidas de forma estática para producción
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Cargar conf rutas
const UserRoutes = require("./routes/user");
const PublicationRoutes = require("./routes/publication");
const FollowRoutes = require("./routes/follow");
const CommentRoutes = require("./routes/comment");
const LikeRoutes = require("./routes/like");

app.use("/api/user", UserRoutes);
app.use("/api/publication", PublicationRoutes);
app.use("/api/follow", FollowRoutes);
app.use("/api/comment", CommentRoutes);
app.use("/api/like", LikeRoutes);

// Ruta de prueba
app.get("/ruta-prueba", (req, res) => {
    
    return res.status(200).json(
        {
            "id": 1,
            "nombre": "Victor",
            "web": "victorroblesweb.es"
        }
    );

})

// Poner servidor a escuchar peticiones http
app.listen(puerto, () => {
    console.log("Servidor de node corriendo en el puerto: ", puerto);
});