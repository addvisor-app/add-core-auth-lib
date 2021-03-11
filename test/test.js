const express = require('express');
var auth = require("../lib/index.js").factory('sap_cf', {'protected':true, "exclude":["/addtax/auth/ui/"]});

const app = express();
app.use(auth.authenticate());

app.get('/addtax/auth/test', function (req, res) {
    console.log('test auth url:', req.url, 'isAuthenticated:', req.headers.isAuthenticated);
    res.status(200).send({test: 'ok'})
});

app.use('/addtax/auth/ui/', auth.signIn(), express.static('./ui/'));

//console.log('routers:',app._router.stack)
console.log('routers:',express.Router().stack);

//instance Server
const port = process.env.PORT || 3050;
const server = app.listen(port, function () {
    console.log("ADDTAX AUTH - Rest Test - port", port);
 });
