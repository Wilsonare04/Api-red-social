const {Schema, model} = require("mongoose");

const PublicationSchema = Schema({
    user: {
        type: Schema.ObjectId,
        ref: "User"
    },
    text: {
        type: String,
        required: function() {
            return !this.shared_from;
        }
    },
    file: String,
    shared_from: {
        type: Schema.ObjectId,
        ref: "Publication"
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = model("Publication", PublicationSchema, "publications");