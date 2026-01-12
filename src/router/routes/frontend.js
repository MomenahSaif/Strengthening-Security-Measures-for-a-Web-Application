'user strict';
const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-secret-key';

const logger = require('../../config/logger');


module.exports = (app,db) => {


function verifyToken(req, res, next) {

    const token = req.session.token;

    if (!token) {
        return res.redirect('/?message=Authentication required');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // attach user info
        next();
    } catch (err) {
        return res.redirect('/?message=Invalid or expired token');
    }
}



app.get('/', (req, res) => {
    const nunjucks = require('nunjucks');
    const message = req.query.message || "Please log in to continue";

    const rendered = nunjucks.renderString(message);

    res.render('user.html', {
        message: rendered
    });
});
    //Front End entry page
    /**
     * GET /
     * @summary Front End Entry Page (SSTI - Server Side Template Injection)(Reflected XXS - Cross Site Scripting)
     * @description  {{range.constructor("return global.process.mainModule.require('child_process').execSync('tail /etc/passwd')")()}}
 | localhost:5000/?message=<script>alert(0)</script>
     * @tags frontend
     * @param {string} message.query - a message to present to the user
  
     app.get('/registerform', async (req, res) => {
        console.log(req.session);
  
        const nunjucks = require('nunjucks')
        const message = req.query.message || "Please log in to continue"
        rendered = nunjucks.renderString(message);
        res.render('user.html',
        {message : rendered});


        // res.render('user',{
        //     data: scope,
        //     message: {message:req.query.message}
        // })
        
    });   */
        //Front End register page
    /**
     * GET /register
     * @summary Front End Entry Page 
     * @description  
     * @tags frontend
     * @param {string} message.query - a message to present to the user
     */
 app.get('/register', (req,res) =>{

    const nunjucks = require('nunjucks')
    const message = req.query.message || "Please log in to continue"
    rendered = nunjucks.renderString(message);
    res.render('user-register.html',
    {message : rendered});


    // res.render('user',{
    //     data: scope,
    //     message: {message:req.query.message}
    // })
    
});
    
 
	 const validator = require('validator');
app.get('/registerform', async (req, res) => {
    try {
        const rawEmail = req.query.email;
        const userName = req.query.name ?? '';
        const userPassword = req.query.password ?? '';
        const userAddress = req.query.address ?? '';

        if (!rawEmail || !validator.isEmail(rawEmail)) {
            return res.redirect('/register?message=Invalid email');
        }

        if (!userPassword || userPassword.length < 6) {
            return res.redirect('/register?message=Password too short');
        }

        const hashedPassword = await bcrypt.hash(userPassword, 10);

        const newUser = await db.user.create({
            email: validator.normalizeEmail(rawEmail),
            password: hashedPassword,
            name: userName,
            address: userAddress,
            role: 'user'
        });

        return res.redirect('/profile?id=' + newUser.id);

    } catch (err) {
        console.error(err);
        return res.redirect('/register?message=Registration failed');
    }
});

    //Front End route to log in
    /**
     * GET /login
     * @summary 
     * @description 
     * @tags frontend
     * @param {string} message.query - a message to present to the user
     * @param {string} email.query.required - email body parameter
     * @param {string} password.query.required - password body parameter
     */
     app.get('/login', async (req, res) => {

    const userEmail = req.query.email  || '';
    const userPassword = req.query.password;

    const users = await db.user.findAll({
        where: { email: userEmail }
    });

    if (users.length === 0) {
        res.redirect('/?message=User not found');
        return;
    }

    const user = users[0];

    const match = await bcrypt.compare(userPassword, user.password);

    if (match) {
        const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
    	);

        logger.info(`LOGIN SUCCESS: ${userEmail}`);
    	req.session.logged = true;
    	req.session.token = token;

    	res.redirect('/profile?id=' + user.id);
    	return;
    }
     logger.warn(`LOGIN FAILED: ${userEmail}`);
    res.redirect('/?message=Wrong password');
});

    //Front End route to profile
    /**
     * GET /profile
     * @summary 
     * @description 
     * @tags frontend
     * @param {string} message.query - a message to present to the user
     * @param {number} id.query.required - Id number of the profile holder
     * @param {string} profile_description
     */
     app.get('/profile', verifyToken, (req,res) =>{

        if(!req.query.id){
            res.redirect("/?message=Could not Access profile please log in or register")
            return;
        }
        const user = db.user.findAll({include: // Notice `include` takes an ARRAY
            'beers',
            where: {
                id: req.query.id
            }}).then(user => {
            if(user.length == 0){
                res.redirect('/?message=User not found, please log in')
                return;
            }
            let beers = db.beer.findAll().then(beers => {

                console.log(user)
                console.log(beers)

            res.render('profile.html',
            {beers : beers, user:user[0]});        })
        
    });
});

//Front End route to profile
    /**
     * GET /beer
     * @summary 
     * @description 
     * @tags frontend
     * @param {number} id.query.required - Id number of the beer
     * @param {number} user.query.required - User id number of user viewing the page
     * @param {string} relationship - The message a user get when loving a beer (this is shown instead of the relationship)
    
     app.get('/beer', (req,res) =>{
        const love_message = "You love this beer ❤️";
        if(!req.query.id){
            res.redirect("/?message=Could not Access beer please try a different beer")
            return;
        }
        const beer = db.beer.findAll({include: 
            'users',
            where: {
                id: req.query.id
            }}).then(beer => {
                if(beer.length == 0){
                    res.redirect('/?message=Beer not found, please try again')
                    return;
                }
                db.user.findOne({where:{id:req.query.user}}).then( user =>{
                    if(!user){
                        res.redirect('/?message=User not found, please try again')
                        return;
                    }
                    user.hasBeer(beer).then(result => {
                        let love_message
                        if(result){ // user loves beer
                            love_message = "You Love THIS BEER!!"
                        }
                        else
                        {//user doesn't love the beer
                            love_message = "..."
                        }
                        if(req.query.relationship){
                            love_message = req.query.relationship
                        }
                        console.log(beer)

            
                        
                    
                    });
                    res.render('beer.html',
                        {beers : beer,message:love_message, user:user[0]});     
                        
                });    
            });
    }); */

	app.get('/beer', verifyToken, (req, res) => {

    if (!req.query.id) {
        return res.redirect("/?message=Could not Access beer please try a different beer");
    }

    db.beer.findAll({
        include: 'users',
        where: { id: req.query.id }
    }).then(beer => {

        if (beer.length === 0) {
            return res.redirect('/?message=Beer not found, please try again');
        }

        db.user.findOne({ where: { id: req.query.user } }).then(user => {

            if (!user) {
                return res.redirect('/?message=User not found, please try again');
            }

            user.hasBeer(beer).then(result => {

                let love_message;

                if (result) {
                    love_message = "You Love THIS BEER!! ❤️";
                } else {
                    love_message = "...";
                }

                if (req.query.relationship) {
                    love_message = req.query.relationship;
                }

                res.render('beer.html', {
                    beers: beer,
                    message: love_message,
                    user: user
                });

            });

        });
    });
});

};
