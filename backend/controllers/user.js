const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10) // On hash le mot de passe
        .then(hash => { // On la récupère
            const user = new User({
                email: req.body.email,
                password: hash
            });
            user.save() // On enregistre le user dans la base de donnée
                .then(() => res.status(201).json({ message: 'Utilisateur créé !!' }))
                .catch(error => {
                    res.status(400).json(error);
                    console.log(error);
                });
        })
        .catch(error => res.status(500).json({ message: error }));
};

exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email }) // On récupère l'utilisateur de la base de donnée
        .then(user => {
            if (!user) { // Si on n'a pas trouvé un user
                return res.status(401).json({ error: 'Utilisateur non trouvé !' })
            }
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) { // Si la comparaison n'est pas bonne
                        return res.status(401).json({ error: 'Mot de passe incorrecte !' })
                    }
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            process.env.MY_WEIRD_TOKEN, // mettre dans .env *****
                            { expiresIn: '24h' }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error })); // Si il y a un problème de connexion
}