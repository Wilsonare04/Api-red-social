// Middleware para comprobar si el usuario es administrador
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(500).send({
            status: "error",
            message: "No se ha proporcionado la información del usuario autenticado"
        });
    }

    if (req.user.role !== "role_admin") {
        return res.status(403).send({
            status: "error",
            message: "No tienes permisos de administrador para realizar esta acción"
        });
    }

    next();
}

module.exports = {
    isAdmin
};
