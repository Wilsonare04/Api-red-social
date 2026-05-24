const Comment = require("../models/comment");
const Publication = require("../models/publication");

// Guardar comentario
const save = (req, res) => {
    const params = req.body;

    if (!params.publication || !params.text) {
        return res.status(400).send({
            status: "error",
            message: "Debes enviar la publicación y el texto del comentario"
        });
    }

    // Validar si existe la publicación original
    Publication.findById(params.publication, (error, publicationStored) => {
        if (error || !publicationStored) {
            return res.status(404).send({
                status: "error",
                message: "La publicación que intentas comentar no existe"
            });
        }

        let newComment = new Comment(params);
        newComment.user = req.user.id;

        newComment.save((saveError, commentStored) => {
            if (saveError || !commentStored) {
                return res.status(400).send({
                    status: "error",
                    message: "No se ha podido guardar el comentario"
                });
            }

            return res.status(200).send({
                status: "success",
                message: "Comentario guardado correctamente",
                comment: commentStored
            });
        });
    });
}

// Eliminar un comentario
const remove = (req, res) => {
    const commentId = req.params.id;

    // Buscar comentario y popular su publicación para conocer el dueño de la publicación comentada
    Comment.findById(commentId)
        .populate("publication")
        .exec((error, commentStored) => {
            if (error || !commentStored) {
                return res.status(404).send({
                    status: "error",
                    message: "El comentario no existe"
                });
            }

            // Permisos de borrado:
            // 1. Autor del comentario
            // 2. Autor de la publicación original
            // 3. Administrador
            const isCommentAuthor = commentStored.user.toString() === req.user.id;
            const isPublicationAuthor = commentStored.publication && commentStored.publication.user.toString() === req.user.id;
            const isAdmin = req.user.role === "role_admin";

            if (!isCommentAuthor && !isPublicationAuthor && !isAdmin) {
                return res.status(403).send({
                    status: "error",
                    message: "No tienes permisos para eliminar este comentario"
                });
            }

            Comment.deleteOne({ _id: commentId }, (deleteError) => {
                if (deleteError) {
                    return res.status(500).send({
                        status: "error",
                        message: "Error al eliminar el comentario"
                    });
                }

                return res.status(200).send({
                    status: "success",
                    message: "Comentario eliminado correctamente",
                    comment: commentId
                });
            });
        });
}

// Listar comentarios de una publicación
const list = (req, res) => {
    const publicationId = req.params.id;
    let page = 1;

    if (req.params.page) {
        page = req.params.page;
    }
    page = parseInt(page);

    const itemsPerPage = 10;

    Comment.find({ publication: publicationId })
        .sort("created_at")
        .populate("user", "-password -role -__v -email")
        .paginate(page, itemsPerPage, (error, comments, total) => {
            if (error || !comments) {
                return res.status(500).send({
                    status: "error",
                    message: "Error al obtener comentarios o no hay comentarios para mostrar"
                });
            }

            return res.status(200).send({
                status: "success",
                comments,
                page,
                total,
                pages: Math.ceil(total / itemsPerPage)
            });
        });
}

module.exports = {
    save,
    remove,
    list
};
