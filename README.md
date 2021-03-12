# add-core-auth-lib
add-core-auth-lib é uma library do pacote ADD Core, que permite aplicações node-js que abstrai autenticação. Tem como objetivo protejer um API com ua autenticação do tipo JWT válida, solicitar a autenticação do tipo JWT para um Identity Provider para uma UI, ou validar a autorização de um usuário de acordo com o escopode um JWT válido.

## Use
Install

`npm install https://github.com/addvisor-app/add-core-auth-lib --save`


## Protect your API
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
        //A library, prenche o headers token com o JWT
        const userName = req.headers.token.user_name;
        res.status(200).send({test: 'success', user: userName});
    }
});

//... start express listner..
```

É possivel proteger a sua API sem precisar implementar na sua função a logica que controla se está autenticado, basta passar no factory as opções com o a propriedade `protected` igual a `true` (valor default é `false`), conforme exemplo abaixo:

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

//... stat express listener..
```

> Caso sua API seja invocado sem o token JWT ou um JWT inválido, é retornado um `status code 401` sem que a função de sua API seja invocada.


## Sign In your UIs
Permite que suas UIs solicitem a autenticação de um usuário no Identity Provider do ambiente onde está hospedado a aplicação, conforme exemplo abaixo:

```javascript
const express = require('express');
const auth = require("add-core-auth-lib").factory('sap_cf');

const app = express();

app.use('/addtax/test/ui/', auth.signIn(), express.static('./sapui5/'));

//... start express listner..
```
> Toda vez que a URI for invocada, vai validar se tem um token JWT valido, caso não tenha, redireciona para o Identity Provider para autenticar o usuário e captura o JWT adicionando no cookie de sessão `x-access-token`.


É possivel que sua aplicação tenha APIs e UIs e você possar proteger as API automaticamente, e também solicitar o logon para o Identity Provider, conforme exemplo abaixo:

```javascript
const express = require('express');
const auth = require("add-core-auth-lib").factory('sap_cf', {'protected':true, "exclude":["/addtax/auth/ui/"]});

const app = express();
app.use(auth.authenticate()); //Library valida o JWT

app.get('/addtax/test/api', function (req, res) {
    //A library, prenche o heades token com o JWT
    const userName = req.headers.token.user_name;
    res.status(200).send({test: 'success', user: userName});
});

app.use('/addtax/test/ui/', auth.signIn(), express.static('./sapui5/'));

//... start express listner..
```
> É necessário informar no construtor do factory, a lista de URIs da UIs na propriedade `exclude`, afim de que o modo `protected` não rejeite a requisição (status code 401), antes que seja executado o middleware `auth.signIn()`


## Autorize your API
TBD - Será possivel validar se o usuário tem permissão para executar uma API de acordo com o scope do JWT, cnforme abaixo:

```javascript
const express = require('express');
const auth = require("add-core-auth-lib").factory('sap_cf', {'protected':true});

const app = express();
app.use(auth.authenticate()); //Library valida o JWT

app.get('/addtax/test/api', auth.autorize(['ROLE_1', 'ROLES_2']), function (req, res) {
    const userName = req.headers.token.user_name;
    res.status(200).send({test: 'success', user: userName});
});

//... stat express listener..
```

## Identity Suported
A ibrary está preparada para interagir com os Identities Providers dos seguintes ambientes:

* `sap_cf` - SAP Cloud Foundry Identity Provider.
* `add_ide` - ADD Identity Provider (Docker). TBD

## License

ADD Cloud - Addvisor