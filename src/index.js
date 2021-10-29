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
  //para passar para frente caso satisfaça tudo
  return next();
}

function getBalance(statement) {
  //criamos uma variável para armazenar depois utilizar la no rota de withdraw
  const balance = statement.reduce((acc, operation) => {
    //basicamente estamos pegando o type para verificar se do tipo credit para somarmos
    //se não for, então ele vai subtrair da conta
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);
  return balance;
}

// Aqui nós estamos criando um usuário com nome e cpf
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
  const { customer } = request;

  return response.json(customer.statement);
});

//aqui estamos criando um rota para fazer deposito
app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: "credit",
  };
  customer.statement.push(statementOperation);

  return response.status(201).send();
});
//aqui nessa rota estamos verificando se a conta e menor ou maior do que a pessoa quer sacar
app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;
  //aqui nós estamos pegando o resultado da funcão getBalance
  const balance = getBalance(customer.statement);
  if (balance < amount) {
    return response.status(400).json({ error: "insufficient founds!" });
  }
  const statementOperation = {
    amount,
    createdAt: new Date(),
    type: "debit",
  };
  customer.statement.push(statementOperation);
  return response.status(201).send();
});

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
  //para chamarmos o customer lá dentro do midlleware(verifyIfExistsAccountCPF) basta desestruturar
  const { customer } = request;
  const { date } = request.query;
  //aqui estamos formatando a data
  const dateFormat = new Date(date + " 00:00");
  //aqui nos estamos a data para o formato 10/10/2021
  const statement = customer.statement.filter(
    (statement) =>
      statement.createdAt.toDateString() === new Date(dateFormat).toDateString()
  );

  return response.json(statement);
});
app.put("/account", verifyIfExistsAccountCPF, (request,response) => {
  const { name } = request.body;
  const {customer} = request;

  customer.name = name;

  return response.status(201).send();

})

app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
  const {customer} = request;
  return response.json(customer);
})

app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
  const {customer} = request;
  

  //metodo splice
  customers.splice(customer, 1)

  return response.status(204).json(customers)
})

app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {
  const {customer} = request;

  const balance = getBalance(customer.statement)
  return response.json(balance);
})

app.listen(3333);
