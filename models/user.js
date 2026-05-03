const mongs = require("mongoose")
const bcrypt = require("bcryptjs")

const formul = new mongs.schema({
    nom: {
        type: String,
        require: true
    },

    email: {
        type: email,
        require: true,
    },

    motDePasse: {
        type: String,
        require: true,
        unique: true
    }
}, {timestamps: true})
