/**
 * Created by martin.harsovski on 7/13/2017.
 */
const Article = require('mongoose').model('Article');

function validateArticle(articleArgs, req) {
    let errMsg = '';

    if (!req.isAuthenticated()) {
        errMsg = 'Sorry, you must be logged';
    } else if (!articleArgs.title) {
        errMsg = 'Title is required';
    } else if (!articleArgs.content) {
        errMsg = 'Content is required!';
    }
    return errMsg;
}
module.exports = {
    createGet: (req, res) => {
        if (!req.isAuthenticated()) {
            res.render('user/login')
        } else {
            res.render('article/create');
        }

    },
    createPost: (req, res) => {
        let articleParts = req.body;
        let errMsg = validateArticle(articleParts, req)
        if (errMsg) {
            res.render('article/create', {
                error: errMsg
            })
            return;
        }

        let image=req.files.image;

        let userId = req.user.id;
        articleParts.author = userId;

        Article.create(articleParts).then(article => {
            req.user.articles.push(article.id)
            req.user.save(err => {
                if (err) {
                    res.render('article/create', {
                        error: err.message
                    })
                } else {
                    res.redirect('/');
                }
            });
        });


    },
    detailsGet: (req, res) => {
        let id = req.params.id;
        Article.findById(id).populate('author').then(article => {

            if (!req.user) {
                res.render('article/details', {article: article, userLogged: false});
                return;
            }


            let userLogged = req.user.isAuthor(article);
            res.render('article/details', {article:article,userLogged: userLogged});

        });

    },
    editGet: (req, res) => {
        let id = req.params.id;
        if (!req.isAuthenticated()) {
            let returnUrl = `/article/edit/${id}`;
            req.session.returnUrl = returnUrl;

            res.redirect('/user/login');
            return;
        }
        Article.findById(id).then(article => {
            if (!req.user.isAuthor(article)) {
                res.render('home/index', {error: 'You have no permission to edit this article '})
                return;
            }
            res.render('article/edit', article)


        })
    },
    editPost: (req, res) => {
        let id = req.params.id;
        let articleArguments = req.body;

        let errMsg = validateArticle(articleArguments, req);
        if (errMsg) {
            res.render('article/edit', {
                error: errMsg
            })
            return;
        }

        Article.update({_id: id}, {
            $set: {
                title: articleArguments.title,
                content: articleArguments.content
            }
        }).then(err => {
            res.redirect(`/article/details/${id}`)
        })
    },
    deleteGet: (req, res) => {
        let id = req.params.id;
        if (!req.isAuthenticated()) {
            let returnUrl = `/article/delete/${id}`;
            req.session.returnUrl = returnUrl;

            res.redirect('/user/login');
            return;
        }

        Article.findById(id).then(article => {
            if (!req.user.isAuthor(article)) {
                res.render('home/index', {error: 'You have no permission to edit this article '})
                return;
            }
            res.render('article/delete', article)
        })
    },
    deletePost: (req, res) => {
        let id = req.params.id;

        Article.findByIdAndRemove(id).then(article => {
            let index = req.user.articles.indexOf(article.id);
            req.user.articles.splice(index, 1);
            req.user.save(err => {
                if (err) {
                    res.redirect('/', {error: err.message})
                } else {
                    res.redirect('/')
                }
            })

        })
    }
};