const Like = require("../models/like");
const Publication = require("../models/publication");

// Dar "Me gusta" (Like)
const save = (req, res) => {
    const publicationId = req.params.id;

    // Verificar que exista la publicación
    Publication.findById(publicationId, (error, publicationStored) => {
        if (error || !publicationStored) {
            return res.status(404).send({
                status: "error",
                message: "La publicación no existe"
            });
        }

        // Crear objeto Like
        const newLike = new Like({
            user: req.user.id,
            publication: publicationId
        });

        newLike.save((saveError, likeStored) => {
            if (saveError) {
                // Código 11000 es de clave duplicada en Mongo (ya le dio like)
                if (saveError.code === 11000) {
                    return res.status(400).send({
                        status: "error",
                        message: "Ya has dado 'Me gusta' a esta publicación"
                    });
                }
                return res.status(500).send({
                    status: "error",
                    message: "Error al guardar el 'Me gusta'"
                });
            }

            return res.status(200).send({
                status: "success",
                message: "Me gusta guardado correctamente",
                like: likeStored
            });
        });
    });
}

// Quitar "Me gusta" (Unlike)
const remove = (req, res) => {
    const publicationId = req.params.id;

    Like.deleteOne({ user: req.user.id, publication: publicationId }, (error, result) => {
        if (error || result.deletedCount === 0) {
            return res.status(400).send({
                status: "error",
                message: "No tienes un 'Me gusta' registrado en esta publicación"
            });
        }

        return res.status(200).send({
            status: "success",
            message: "Se quitó el 'Me gusta' correctamente"
        });
    });
}

// Listar usuarios a los que les gusta una publicación
const listUsers = (req, res) => {
    const publicationId = req.params.id;
    let page = 1;
    if (req.params.page) page = req.params.page;
    page = parseInt(page);

    const itemsPerPage = 10;

    Like.find({ publication: publicationId })
        .populate("user", "-password -role -__v -email")
        .paginate(page, itemsPerPage, (error, likes, total) => {
            if (error || !likes) {
                return res.status(500).send({
                    status: "error",
                    message: "Error al obtener la lista de likes"
                });
            }

            return res.status(200).send({
                status: "success",
                likes,
                page,
                total,
                pages: Math.ceil(total / itemsPerPage)
            });
        });
}

// Listar publicaciones que le gustan a un usuario
const listPublications = (req, res) => {
    const userId = req.params.id;
    let page = 1;
    if (req.params.page) page = req.params.page;
    page = parseInt(page);

    const itemsPerPage = 10;

    Like.find({ user: userId })
        .populate({
            path: "publication",
            populate: [
                { path: "user", select: "-password -role -__v -email" },
                { path: "shared_from", populate: { path: "user", select: "-password -role -__v -email" } }
            ]
        })
        .paginate(page, itemsPerPage, (error, likes, total) => {
            if (error || !likes) {
                return res.status(500).send({
                    status: "error",
                    message: "Error al obtener las publicaciones gustadas"
                });
            }

            return res.status(200).send({
                status: "success",
                likes,
                page,
                total,
                pages: Math.ceil(total / itemsPerPage)
            });
        });
}

module.exports = {
    save,
    remove,
    listUsers,
    listPublications
};
