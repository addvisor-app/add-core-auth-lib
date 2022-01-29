# add-core-auth-lib

add-core-auth-lib é uma library do pacote ADD Core, que permite aplicações node-js que abstrai autenticação. Tem como objetivo protejer um API com ua autenticação do tipo JWT válida, solicitar a autenticação do tipo JWT para um Identity Provider para uma UI, ou validar a autorização de um usuário de acordo com o escopode um JWT válido.

## Use

Install

`npm install https://github.com/addvisor-app/add-core-auth-lib --save`

## Identity Suported

A library está preparada para interagir com clients dos Identities Providers dos seguintes ambientes:

* `sap_cf` \- SAP Cloud Foundry Identity Provider\.
* `add_ide` \- ADD Identity Provider\.

O tipo do client definido na variavel de ambeinte `ADD_IDENTITY_CLIENT` da aplicação `add-core-flow-api`, e server para todas as aplicações do sub-account. Para que a library importada no seu projeto seja capaz de alcançar essa variável, é necessário definir uma variável de ambiente no projeto local com a URL da aplicação `add-core-flow-api` no seu arquivo manifest, da seguinte forma:

``` javascript
 env:
    ADD_GLOBAL_VARIABLE_URL: 'https://add-core-flow-api-((subaccount)).((domain))/add/flow/runtime/variables'
```

## Protect your API

Permite que suas APIs só possam ser consumidas caso seja invocadas com um token JWT valido, conforme exemplo abaixo:

``` javascript
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

``` javascript
const express = require('express');
const auth = require("add-core-auth-lib").factory({'protected':true});

const app = express();

app.get('/addtax/test/api', auth.authenticate(), function (req, res) {
    //A library, spo permite entrar na unção se o JWT estiver valido:
    //Caso contrario devolve um statucode 401 não permitindo entrar na função;
    //Caso verdadeiro, permite entrar na função e prenche o heades token com o JWT;
    const userName = req.headers.token.user_name;
    res.status(200).send({test: 'success', user: userName});
});

//... stat express listener..
```

> Caso sua API seja invocado sem o token JWT ou um JWT inválido, é retornado um `status code 401` sem que a função de sua API seja invocada.

## Sign In your UIs

Permite que suas UIs solicitem a autenticação de um usuário no Identity Provider do ambiente onde está hospedado a aplicação, conforme exemplo abaixo:

``` javascript
const express = require('express');
const auth = require("add-core-auth-lib").factory({'protected':true});

const app = express();

app.use('/addtax/test/ui/', auth.signIn(), express.static('./sapui5/'));

//... start express listner..
```

> Toda vez que a URI for invocada, vai validar se tem um token JWT valido, caso não tenha, redireciona para o Identity Provider para autenticar o usuário e captura o JWT adicionando no cookie de sessão `x-access-token`.

## Autorize your API

TBD - Será possivel validar se o usuário tem permissão para executar uma API de acordo com o scope do JWT, cnforme abaixo:

``` javascript
const express = require('express');
const auth = require("add-core-auth-lib").factory({'protected':true});

const app = express();

app.get('/addtax/test/api', auth.autorize(['ROLE_1', 'ROLES_2']).authenticate(), function (req, res) {
    const userName = req.headers.token.user_name;
    res.status(200).send({test: 'success', user: userName});
});

//... stat express listener..
```

## Factory Properties

As seguintes propriedades são aceitas no contrutor da library:

* `client` \- Essa propriedade define o client do Identity Provider\, porem não é recomendado passar pelo contrututor\, visto que a library busca essa proriedade na variavel de ambeinte `ADD_IDENTITY_CLIENT` da aplicação `add-core-flow-api`, e server para todas as aplicações do sub-account e independente do ambiente de depoy do microservice.
* `debug` \- Essa proriedade define se os log da Library serão exibidos no microservice\, porem nã é recomendado passar como paramentro\, mas parametrizar como variavel de ambiente `ADD_AUTH_DEBUG`(boolean, o default é false).
* `protected` \- Essa propriedade define se o middleware `authenticate` vai barrar a implementação da função da API. Caso a requisição não tenha o JWT, o modo protected igual a `false` (default) e permite executar a função indicando no headers que não esta autenticado, ja como `true`, não deixa executar a função devolvendo o status code 401.

## Architecture

Segue abaixo o diagrama de sequencia das interações da library para os metodos `authenticate` e `signin`

### Authenticate

![alt text](https://github.com/addvisor-app/add-core-auth-lib/blob/master/lib/img/diagram_authenticated.png)

### SignIn

![alt text](https://github.com/addvisor-app/add-core-auth-lib/blob/master/lib/img/diagram_signin.png)

## License

ADD Cloud - Addvisor