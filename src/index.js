const express = require("express");
//nessa importação estamos renomeado a variável, importação da chave única
const { v4: uuidv4 } = require("uuid");
const app = express();

app.use(express.json());

//criando um array para simularmos um banco de dados porque não temos
const customers = [];

//Middleware
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

   //verificando se há um dado dentro do customer se não tiver ele retorna a mensagem dentro do json
  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: "Custumer not fund" });
  }

  //Fazendo isso agora toda rota que chamar esse midlleware terá acesso ao customer
  request.customer = customer;

  return next();
}

app.post("/account", (request, response) => {
  //aqui eu estou desestruturando {cpf, name}
  const { cpf, name } = request.body;

  //aqui nós estamos criando e verificando se há outra com o mesmo cpf e nao perrmitindo a criação
  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return response.status(400).json({ error: "Customer already Exists!" });
  }

  //aqui nos estamos criando o usuario
  customers.push({
    name,
    cpf,
    id: uuidv4(),
    statement: [],
  });
  return response.status(201).send();
});

//existe uma outra forma de passar os midlleware, quando queremos que todas as nossas rota tenham acesso a ela
//app.use(verifyIfExistsAccountCPF);

//aqui estamos criando a rota para buscarmos o cpf do cliente que criamos na rota account com o post
app.get("/statement/", verifyIfExistsAccountCPF, (request, response) => {
    
    //para chamarmos o customer lá dentro do midlleware(verifyIfExistsAccountCPF) basta desestruturar
    const {customer} = request;

  return response.json(customer.statement);
});

app.listen(3333);
