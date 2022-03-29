const Sauce = require('../models/Sauce');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.addSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save()
        .then(() => res.status(201).json({ message: "Sauce enregistrée !" }))
        .catch(error => {
            res.status(401).json(error);
            console.log(error);
        });
};

exports.modifySauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            const sauceObject = req.file ?
                { // S'il Y A un image à modifier
                    ...JSON.parse(req.body.sauce),
                    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
                }
                // S'il N'Y A PAS un image à modifier
                : { ...req.body };
                
                if(req.file) {
                    const filename = sauce.imageUrl.split('/images/')[1];
                    fs.unlinkSync(`images/${filename}`)
                }
                Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
                    .catch(error => {
                        res.status(400).json(error);
                        console.log(error);
                    })
        })
        .catch(error => res.status(500).json(error))
}

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: "Sauce supprimée !" }))
                    .catch(error => {
                        res.status(400).json(error);
                        console.log(error);
                    });
            });
        })
        .catch(error => {
            res.status(500).json(error);
            console.log(error);
        })
}

exports.getOne = (req, res, next) => {
    Sauce.findById({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => {
            res.status(404).json({ message: 'Sauce introuvable !' }, error);
            console.log(error);
        });
}

exports.getAll = (req, res, next) => {
    Sauce.find()
        .then(sauce => res.status(200).json(sauce))
        .catch(error => {
            res.status(500).json(error);
            console.log(error);
        });
};

exports.getLike = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (!sauce) {
                return res.status(404).json({ message: "Sauce introuvable !" })
            }
            const like = parseInt(req.body.like);

            let usersLiked = sauce.usersLiked;
            let usersDisliked = sauce.usersDisliked;

            const token = req.headers.authorization.split(' ')[1];
            const decodedToken = jwt.verify(token, process.env.MY_WEIRD_TOKEN);
            const userId = decodedToken.userId;

            if (like == 1 && usersLiked.includes(userId) == false) {
                usersLiked.push(userId);
            } else if (like == 0 && usersLiked.includes(userId)) {
                usersLiked.pull(userId);
            } else if (like == 0 && usersDisliked.includes(userId)) {
                usersDisliked.pull(userId);
            } else if (like == -1 && usersDisliked.includes(userId) == false) {
                usersDisliked.push(userId);
            }

            sauce.likes = usersLiked.length;
            sauce.dislikes = usersDisliked.length;

            sauce.save()
                .then(() => res.status(200).json({ message: 'Likes modifiée !' }))
                .catch(error => {
                    res.status(400).json(error);
                    console.log(error);
                })

        })
        .catch(error => {
            res.status(500).json(error);
            console.log(error);
        });
}