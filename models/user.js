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

formul.pre("save", async (next) => {
    if(!isModified("motDePasse")) return next()
    this.motDePasse = await bcrypt.hash(this.motDePasse, 10)
    next()
})

module.exports = mongs.model('User', formul)