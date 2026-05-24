const {Schema, model} = require("mongoose");

const LikeSchema = Schema({
    user: {
        type: Schema.ObjectId,
        ref: "User",
        required: true
    },
    publication: {
        type: Schema.ObjectId,
        ref: "Publication",
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Índice compuesto único para evitar múltiples likes del mismo usuario en la misma publicación
LikeSchema.index({ user: 1, publication: 1 }, { unique: true });

module.exports = model("Like", LikeSchema, "likes");
