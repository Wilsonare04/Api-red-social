const {Schema, model} = require("mongoose");

const CommentSchema = Schema({
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
    text: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = model("Comment", CommentSchema, "comments");
