# add-core-auth-lib
add-core-auth-lib é uma library do pacote ADD Core, que permite aplicações node-js que abstrai autenticação. Tem como objetivo protejer um API com ua autenticação do tipo JWT válida, solicitar a autenticação do tipo JWT para um Identity Provider para uma UI, ou validar a autorização de um usuário de acordo com o escopode um JWT válido.

## Use
Install

`npm install https://github.com/addvisor-app/add-core-auth-lib --save`


## Protect your API
Permite que suas APIs só possam ser consumidas caso seja invocadas com um token JWT valido, conforme exemplo abaixo:

```javascript
const express = require('express');
const auth = require("add-core-auth-lib").factory();

const app = express();

app.get('/addtax/test/api', auth.authenticate(), function (req, res) {

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
const auth = require("add-core-auth-lib").factory({'protected':true});

const app = express();

app.get('/addtax/test/api', auth.authenticate(), function (req, res) {
    //A library, spo permite entrar na unção se o JWT estiver valido,
    //caso contrario devolve um statucode 401
    //Caso erdadeiro, permite entrar na função e prenche o heades token com o JWT
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
const auth = require("add-core-auth-lib").factory({'protected':true});

const app = express();

app.use('/addtax/test/ui/', auth.signIn(), express.static('./sapui5/'));

//... start express listner..
```
> Toda vez que a URI for invocada, vai validar se tem um token JWT valido, caso não tenha, redireciona para o Identity Provider para autenticar o usuário e captura o JWT adicionando no cookie de sessão `x-access-token`.


## Autorize your API
TBD - Será possivel validar se o usuário tem permissão para executar uma API de acordo com o scope do JWT, cnforme abaixo:

```javascript
const express = require('express');
const auth = require("add-core-auth-lib").factory({'protected':true});

const app = express();
app.use(auth.authenticate()); //Library valida o JWT

app.get('/addtax/test/api', auth.autorize(['ROLE_1', 'ROLES_2']).authenticate(), function (req, res) {
    const userName = req.headers.token.user_name;
    res.status(200).send({test: 'success', user: userName});
});

//... stat express listener..
```

## Identity Suported
A library está preparada para interagir com os Identities Providers dos seguintes ambientes:

* `sap_cf` - SAP Cloud Foundry Identity Provider.
* `add_ide` - ADD Identity Provider.

O Identity client é definido na variavel de ambeinte da aplicação add-core-flow-api, e server para todas as aplicações do sub-account. Para que a library seja capaz de alcançar essas variáveis, é necessário definir a variavel de ambiente local com a URL da aplicação core pelo no arquivo manifest, da seguinte forma:

```javascript
 env:
    ADD_GLOBAL_VARIABLE_URL: 'https://add-core-flow-api-((subaccount)).((domain))/add/flow/runtime/variables'
```

## License

ADD Cloud - Addvisor