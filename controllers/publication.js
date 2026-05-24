// Importar modulos
const fs = require("fs");
const path = require("path");

// Importar modelos
const Publication = require("../models/publication");

// Importar servicios
const followService = require("../services/followService");

// Acciones de prueba
const pruebaPublication = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/publication.js"
    });
}

// Guardar publicacion
const save = (req, res) => {
    // Recoger datos del body
    const params = req.body;

    // SI no me llegan dar respuesta negativa
    if (!params.text) return res.status(400).send({ status: "error", "message": "Debes enviar el texto de la publicacion." });

    // Crear y rellenar el objeto del modelo
    let newPublication = new Publication(params);
    newPublication.user = req.user.id;

    // Guardar objeto en bbdd
    newPublication.save((error, publicationStored) => {

        if (error || !publicationStored) return res.status(400).send({ status: "error", "message": "No se ha guardado la publicación." });

        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Publicación guardada",
            publicationStored
        });
    });
}

// Sacar una publicacion
const detail = (req, res) => {
    // Sacar id de publicacion de la url
    const publicationId = req.params.id;

    // Find con la condicion del id
    Publication.findById(publicationId)
        .populate("user", "-password -role -__v -email")
        .populate({
            path: "shared_from",
            populate: {
                path: "user",
                select: "-password -__v -role -email"
            }
        })
        .exec((error, publicationStored) => {
            if (error || !publicationStored) {
                return res.status(404).send({
                    status: "error",
                    message: "No existe la publicacion"
                });
            }

            // Devolver respuesta
            return res.status(200).send({
                status: "success",
                message: "Mostrar publicacion",
                publication: publicationStored
            });
        });
}

// Eliminar publicaciones (Autor o Admin)
const remove = (req, res) => {
    // Sacar el id del publicacion a eliminar
    const publicationId = req.params.id;

    // Buscar la publicación para saber si existe y quién es su dueño
    Publication.findById(publicationId, (error, publicationStored) => {
        if (error || !publicationStored) {
            return res.status(404).send({
                status: "error",
                message: "No existe la publicación"
            });
        }

        // Comprobar si el usuario logueado es el dueño o es administrador
        if (publicationStored.user.toString() !== req.user.id && req.user.role !== "role_admin") {
            return res.status(403).send({
                status: "error",
                message: "No tienes permiso para eliminar esta publicación"
            });
        }

        // Borrado
        Publication.deleteOne({ _id: publicationId }, async (deleteError) => {
            if (deleteError) {
                return res.status(500).send({
                    status: "error",
                    message: "No se ha eliminado la publicación"
                });
            }

            // Borrado en cascada: comentarios, likes y publicaciones compartidas de ésta
            const Comment = require("../models/comment");
            const Like = require("../models/like");
            try {
                await Comment.deleteMany({ publication: publicationId });
                await Like.deleteMany({ publication: publicationId });
                await Publication.deleteMany({ shared_from: publicationId });
            } catch (err) {
                console.error("Error al borrar elementos relacionados de la publicación:", err);
            }

            // Devolver respuesta
            return res.status(200).send({
                status: "success",
                message: "Publicación eliminada correctamente",
                publication: publicationId
            });
        });
    });
}

// listar publicaciones de un usuario
const user = (req, res) => {
    // Sacar el id de usuario
    const userId = req.params.id;

    // Controlar la pagina
    let page = 1;

    if (req.params.page) page = req.params.page
    page = parseInt(page);

    const itemsPerPage = 5;

    // Find, populate, ordenar, paginar
    Publication.find({ "user": userId })
        .sort("-created_at")
        .populate('user', '-password -__v -role -email')
        .populate({
            path: 'shared_from',
            populate: {
                path: 'user',
                select: '-password -__v -role -email'
            }
        })
        .paginate(page, itemsPerPage, (error, publications, total) => {

            if (error || !publications || publications.length <= 0) {
                return res.status(404).send({
                    status: "error",
                    message: "No hay publicaciones para mostrar"
                });
            }

            // Devolver respuesta
            return res.status(200).send({
                status: "success",
                message: "Publicaciones del perfil de un usuario",
                page,
                total,
                pages: Math.ceil(total / itemsPerPage),
                publications,

            });
        });
}

// Subir ficheros
const upload = (req, res) => {
    // Sacar publication id
    const publicationId = req.params.id;

    // Recoger el fichero de imagen y comprobar que existe
    if (!req.file) {
        return res.status(404).send({
            status: "error",
            message: "Petición no incluye la imagen"
        });
    }

    // Conseguir el nombre del archivo
    let image = req.file.originalname;

    // Sacar la extension del archivo
    const imageSplit = image.split("\.");
    const extension = imageSplit[1];

    // Comprobar extension
    if (extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif") {

        // Borrar archivo subido
        const filePath = req.file.path;
        const fileDeleted = fs.unlinkSync(filePath);

        // Devolver respuesta negativa
        return res.status(400).send({
            status: "error",
            message: "Extensión del fichero invalida"
        });
    }

    // Si si es correcta, guardar imagen en bbdd
    Publication.findOneAndUpdate({ "user": req.user.id, "_id": publicationId }, { file: req.file.filename }, { new: true }, (error, publicationUpdated) => {
        if (error || !publicationUpdated) {
            return res.status(500).send({
                status: "error",
                message: "Error en la subida del avatar"
            })
        }

        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            publication: publicationUpdated,
            file: req.file,
        });
    });

}

// Devolver archivos multimedia imagenes
const media = (req, res) => {
    // Sacar el parametro de la url
    const file = req.params.file;

    // Montar el path real de la imagen
    const filePath = "./uploads/publications/" + file;

    // Comprobar que existe
    fs.stat(filePath, (error, exists) => {

        if (!exists) {
            return res.status(404).send({
                status: "error",
                message: "No existe la imagen"
            });
        }

        // Devolver un file
        return res.sendFile(path.resolve(filePath));
    });

}

// Listar todas las publicaciones (FEED)
const feed = async (req, res) => {
    // Sacar la pagina actual
    let page = 1;

    if (req.params.page) {
        page = req.params.page;
    }
    page = parseInt(page);

    // Establecer numero de elementos por pagina
    let itemsPerPage = 5;

    // Sacar un array de identificadores de usuarios que yo sigo como usuario logueado
    try {
        const myFollows = await followService.followUserIds(req.user.id);

        // Incluimos al propio usuario en su feed también
        const feedUsers = [...myFollows.following, req.user.id];

        // Find a publicaciones in, ordenar, popular, paginar
        const publications = Publication.find({ user: { $in: feedUsers } })
            .populate("user", "-password -role -__v -email")
            .populate({
                path: "shared_from",
                populate: {
                    path: "user",
                    select: "-password -__v -role -email"
                }
            })
            .sort("-created_at")
            .paginate(page, itemsPerPage, (error, publications, total) => {

                if(error || !publications){
                    return res.status(500).send({
                        status: "error",
                        message: "No hay publicaciones para mostrar",
                    });
                }

                return res.status(200).send({
                    status: "success",
                    message: "Feed de publicaciones",
                    following: myFollows.following,
                    total,
                    page,
                    pages: Math.ceil(total / itemsPerPage),
                    publications
                });
            });

    } catch (error) {

        return res.status(500).send({
            status: "error",
            message: "Error al obtener usuarios que sigues",
        });
    }

}

// Compartir publicación (Share/Retweet)
const share = (req, res) => {
    const publicationId = req.params.id;
    const params = req.body;

    // Buscar si existe la publicación original
    Publication.findById(publicationId, (error, publicationStored) => {
        if (error || !publicationStored) {
            return res.status(404).send({
                status: "error",
                message: "No existe la publicación original que deseas compartir"
            });
        }

        // Si la publicación ya es un compartido, referenciar a la publicación original
        const originalId = publicationStored.shared_from ? publicationStored.shared_from : publicationStored._id;

        // Crear nueva publicación de tipo compartir
        const newShare = new Publication();
        newShare.user = req.user.id;
        newShare.shared_from = originalId;
        
        if (params.text) {
            newShare.text = params.text;
        }

        newShare.save((saveError, shareStored) => {
            if (saveError || !shareStored) {
                return res.status(400).send({
                    status: "error",
                    message: "No se pudo compartir la publicación"
                });
            }

            return res.status(200).send({
                status: "success",
                message: "Publicación compartida correctamente",
                share: shareStored
            });
        });
    });
}

// Exportar acciones
module.exports = {
    pruebaPublication,
    save,
    detail,
    remove,
    user,
    upload,
    media,
    feed,
    share
}