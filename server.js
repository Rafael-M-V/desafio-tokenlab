/*
    AUTOR: RAFAEL MELIANI VELLOSO
    PROJETO: DESAFIO DA EMPRESA TOKENLAB PARA VAGA DE ESTÁGIO.
    DESCRIÇÃO: PEQUENA APLICAÇÃO PARA GERENCIAMENTO DE EVENTOS.
*/

const express = require('express');
const bodyparser = require('body-parser');
const mysql = require('mysql');

const app = express();

var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '*****',
    database: 'db',
    multipleStatements: true
});


/* Funções auxiliares */

/* Deixa mes ou dia no formato esperado, ou seja, com dois digitos */
function set_month_day(m){
    if(m.length === 1)
        return '0' + m;
    return m;
}

/* Converte numero do mes em nome do mes */
function month_name(month)
{
    switch (month)
    {
        case 0: return "Janeiro";
        case 1: return "Fevereiro";
        case 2: return "Março";
        case 3: return "Abril";
        case 4: return "Maio";
        case 5: return "Junho";
        case 6: return "Julho";
        case 7: return "Agosto";
        case 8: return "Setembro";
        case 9: return "Outubro";
        case 10: return "Novembro";
        case 11: return "Dezembro";
        default: return "ERRO";
    }
}

/* Converte nome do mes em numero do mes */
function month_number(month)
{
    if(month === 'Janeiro') return '01';
    if(month === 'Fevereiro') return '02';
    if(month === 'Março') return '03';
    if(month === 'Abril') return '04';
    if(month === 'Maio') return '05';
    if(month === 'Junho') return '06';
    if(month === 'Julho') return '07';
    if(month === 'Agosto') return '08';
    if(month === 'Setembro') return '09';
    if(month === 'Outubro') return '10';
    if(month === 'Novembro') return '11';
    if(month === 'Dezembro') return '12';

    return '';
}

app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());

app.set('view-engine', 'ejs');

/* GET */

/* home */
app.get('/', (req, res) => {
    res.render('home.ejs');
    res.end();
});

/* Pagina de cadastro */
app.get('/cadastro', (req, res) => {
    res.render('cadastro.ejs');
    res.end();
});

/* Pagina de calendario (nao pode ser acessada diretamente) */
app.get('/calendario', (req, res) => {
    res.end();
});


/* POST */

/* Recebe login de usuario */
app.post('/', (req, res) => {

    var user_data = {
        user: req.body.user, // usuario
        passw: req.body.passw // senha
    };

    // data atual
    var date = {
        dia: set_month_day(new Date().getDate().toString()),
        mes: set_month_day(((new Date().getMonth())+1).toString()),
        ano: new Date().getFullYear().toString()
    };

    // Procura algum usuario na base de dados que corresponde com o que foi digitado.
    // Procura eventos na base de dados que pertencem ao mes e ano atuais
    con.query("SELECT * FROM users WHERE BINARY email=? AND passw=?;\
               SELECT descr, dia, mes, ano, inicio, termino FROM events WHERE mes=? AND ano=?",
    [user_data.user, user_data.passw, date.mes, date.ano],
    (err, result) => {
        if(err)
            throw err;

        if(result[0].length != 0) // se usuario existe na base de dados...
        {
            // carrega calendario
            res.render('calendario.ejs',
            {
                data: JSON.stringify(result[1]), // eventos
                user: user_data.user, // usuario
                month: date.mes, // mes atual
                year: date.ano, // ano atual
                mname: month_name(parseInt(date.mes, 10)-1) // nome do mes
            });
        }
        else // redireciona para pagina home
        {
            res.redirect('/');
        }

        res.end();
    });
});

/* Recebe cadastro de usuario */
app.post('/cadastro', (req, res) => {
    var data = {
        name: req.body.name, // nome
        email: req.body.email, // email
        passw: req.body.passw // senha
    };

    con.connect((err) => {
        if(err)
            throw err;

        // verifica se email ja esta cadastrado na base de dados
        con.query("SELECT * FROM users WHERE BINARY email=?", [data.email], (err, result, fields) => {
            if(err)
                throw err;

            if(result.length === 0) // se email nao esta cadastrado...
            {
                // insere novo usuario na base de dados
                con.query("INSERT INTO users (name, email, passw) VALUES(?,?,?)",
                [data.name, data.email, data.passw],
                (err, result) => {
                    if(err)
                        throw err;
                });
            }
        });

    });

    res.render('home.ejs');
    res.end();
});

/* Adicionar, remover ou editar eventos */
app.post('/calendario', (req, res) => {

    var data = {
        descr: req.body.descr, // descricao
        dia: req.body.day, // dia
        mes: month_number(req.body.month), // mes
        ano: req.body.year, // ano
        inicio: req.body.inicio_hora + ':' + req.body.inicio_minuto, // hora de inicio
        termino: req.body.termino_hora + ':' + req.body.termino_minuto, // hora de termino
        user: req.body.user // usuario que fez a operacao
    };

    if(req.body.acao == 'Adicionar') // se usuario quis adicionar evento...
    {
        // insere novo evento na base de dados
        con.query("INSERT INTO events (descr, dia, mes, ano, inicio, termino, user) VALUES(?,?,?,?,?,?,?)",
        [data.descr, data.dia, data.mes, data.ano, data.inicio, data.termino, data.user],
        (err) => {
            if(err)
                throw err;
        });

    }
    else if(req.body.acao == 'Editar')
    {
        // to do
    }
    else if(req.body.acao == 'Remover') // se usuario quis remover evento...
    {
        //
        con.query("DELETE FROM events WHERE descr=? AND dia=? AND mes=? AND ano=? AND inicio=? AND termino=? AND user=?",
        [data.descr, data.dia, data.mes, data.ano, data.inicio, data.termino, data.user],
        (err) => {
            if(err)
                throw err;
        });
    }

    res.redirect('/');
    res.end();
});

app.listen(3000);
