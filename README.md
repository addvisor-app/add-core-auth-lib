# add-core-auth-lib
add-core-auth-lib é uma library para aplicações node-js que abstrai autenticação do pacote ADD Core. Tem como objetivo validar autenticação do tipo JWT para as APIs, e para as UIs , direcionar para o logon com diversos Identity Provides de acordo com o Environment onde será publicado sua aplicação.

## Use
Install

`npm install https://github.com/addvisor-app/add-core-auth-lib --save`

## Protect API

Permite que suas APIs só possam ser consumidas caso seja invocadas com um token JWT valido, conforme exemplo abaixo:

```javascript
const express = require('express');
const auth = require("add-core-auth-lib").factory('sap_cf');

const app = express();
app.use(auth.authenticate()); //Library valida o JWT

app.get('/addtax/test/api', function (req, res) {

    //A library, prenche o heades isAuthenticated TRUE se tem um JWT válido
    if(!req.headers.isAuthenticated){
        res.status(401).send({test: 'error'})

    }else{
        //A library, prenche o heades token com o JWT
        const userName = req.headers.token.user_name;
        res.status(200).send({test: 'success', user: userName});
    }
});

//... start express listner..
```

É possivel proteger a sua API sem precisar implementar na logica do seu metódo o controle se está autenticado. Basta passar no factory as opções com o a propriedade `protected` igual a ```javascript true``` (valor default é ```javascript false ```), conforme exemplo abaixo:

```javascript
const express = require('express');
const auth = require("add-core-auth-lib").factory('sap_cf', {'protected':true});

const app = express();
app.use(auth.authenticate()); //Library valida o JWT

app.get('/addtax/test/api', function (req, res) {
    //A library, prenche o heades token com o JWT
    const userName = req.headers.token.user_name;
    res.status(200).send({test: 'success', user: userName});
});

//... start express listner..
```

> Caso sua API seja ninvocado sem o token JWT ou inválido, é retornado um `status code 401` sem que sua API seja invocada.


