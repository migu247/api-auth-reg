'use strict'
const port = process.env.PORT || 4000;

const https = require('https');
const fs = require('fs');

const OPTIONS_HTTPS = {
  key: fs.readFileSync('./cert/key.pem'),
  cert: fs.readFileSync('./cert/cert.pem')
}


const TokenService = require('./services/token.service');
const PassService = require('./services/pass.service');
const moment = require('moment');
const express = require('express');
const logger = require('morgan');
const mongojs = require('mongojs');
const { encriptaPassword, comparaPassword } = require('./services/pass.service');
//const cors = require('cors'); 

var db = mongojs('users');
var id = mongojs.ObjectID;
var allowCrossTokenHeader = (req, res, next) => { 
  res.header("Access-Control-Allow-Headers", "*"); 
  return next(); 
}; 
 
var allowCrossTokenOrigin = (req, res, next) => { 
  res.header("Access-Control-Allow-Origin", "*"); 
  return next(); 
}; 

var auth = (req, res, next) => { 
  if(req.headers.token === "password1234") { 
      return next(); 
  } else { 
      return next(new Error("No autorizado")); 
  }; 
};


const app = express();


// Declaramos los middleware
app.use(logger('dev')); // probar con: tiny, short, dev, common, combined
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
//app.use(cors()); 
app.use(allowCrossTokenHeader); 
app.use(allowCrossTokenOrigin);


app.param("coleccion", (req, res, next, coleccion) =>{
  console.log('param /api/user');
  console.log('coleccion: ', coleccion);

  db.user = db.collection(coleccion);
  return next();
});

// routes
app.get('/api/user', (req, res, next) => {
  console.log(req.params); 
  db.user.find((err, coleccion) => { 
    if (err) return next(err); 
    res.json(coleccion); 
  }); 
});

app.get('/api/auth', (req, res, next) => {
  console.log(req.params); 
  
  db.user.find((err, coleccion) => { 
    if (err) return next(err); 
    const userRed = coleccion.map(user =>{return{
          nombre: user.nombre,
          email: user.email
    }});
    res.json(userRed); 
  }); 
});

app.get('/api/user/:id', (req, res, next) => { 
  db.user.findOne({_id: id(req.params.id)}, (err, elemento) => { 
    if (err) return next(err); 
    res.json(elemento); 
  }); 
 }); 
 
app.post('/api/user', auth,(req, res, next) => { 
  const elemento = req.body; 
  console.log(elemento);

  if (!elemento.nombre) { 
    res.status(400).json ({ 
    error: 'Bad data', 
    description: 'Se precisa al menos un campo <nombre>' 
    }); 
  } else { 
  db.user.save(elemento, (err, coleccionGuardada) => { 
      if(err) return next(err); 
      res.json(coleccionGuardada); 
    }); 
  } 
}); 

app.put('/api/user/:id', auth,(req, res, next) => { 
  let elementoId = req.params.id; 
  let elementoNuevo = req.body; 
  db.user.update({_id: id(elementoId)}, 
  {$set: elementoNuevo}, {safe: true, multi: false}, (err, elementoModif) => { 
    if (err) return next(err); 
    res.json(elementoModif); 
  }); 
}); 
 
app.delete('/api/user/:id', auth,(req, res, next) => { 
  let elementoId = req.params.id; 

  db.user.remove({_id: id(elementoId)}, (err, resultado) => { 
    if (err) return next(err); 
    res.json(resultado); 
  }); 
}); 

app.post('/api/auth', auth,(req, res, next) => { 
  const elemento = req.body; 
  console.log(elemento);


  if (!elemento.email) { 
    res.status(400).json ({ 
    error: 'Bad data', 
    description: 'Se precisa al menos un campo <emial>' 
    }); 
  } else if(!elemento.pass) { 
    res.status(400).json ({ 
    error: 'Bad data', 
    description: 'Se precisa al menos un campo <pass>' 
    }); 

  }else { 
  
    db.user.findOne({ email: elemento.email }, (err, usuario)=>{
      if(err) return next(err);
      if(!usuario ){
          response.status(400).json({});
      }else{
          PassService.comparaPassword(elemento.pass, usuario.pass)
          .then(val => {
              if(val){
                const ctoken = TokenService.crearToken(usuario);
                  res.json({
                      result: 'OK',
                      user: elemento,
                      token: ctoken
                  });
              }else{
                res.json({
                  result: 'NOT OK'
              });
              }

                  
                
          });
    
      }
  })
  
  } 
}); 



app.post('/api/reg', auth,(req, res, next) => { 
  const elemento = req.body; 
  console.log(elemento);

  if (!elemento.nombre) { 
    res.status(400).json ({ 
    error: 'Bad data', 
    description: 'Se precisa al menos un campo <nombre>' 
    }); 
  } else if(!elemento.email) { 
    res.status(400).json ({ 
    error: 'Bad data', 
    description: 'Se precisa al menos un campo <email>' 
    }); 

  }else if(!elemento.pass) { 
    res.status(400).json ({ 
    error: 'Bad data', 
    description: 'Se precisa al menos un campo <pass>' 
    }); 

  } else { 
  
    db.user.findOne({ email: elemento.email }, (err, usuario)=>{
      if(err) return next(err);
      if(!usuario ){
          response.status(400).json({});
      }else{
          PassService.encriptaPassword(elemento.pass)
          .then(passEnc => {
             
             const usuario = {
                  email: elemento.email,
                  name: elemento.nombre,
                  pass: passEnc,
                  signUpDate: moment().unix(),
                  lastLogin: moment().unix()
                  
              };
              db.user.save(usuario, (err, coleccionGuardada) => { 
                  if(err) return next(err);
                  const ctoken = TokenService.crearToken(usuario);
                  res.json({
                      result: 'OK',
                      user: coleccionGuardada,
                      token: ctoken
                  });
              }); 
          });

          
      }
  })
  
  } 
}); 
 
 
https.createServer(OPTIONS_HTTPS, app).listen(port, () => { 
  console.log(`SEC WS API REST ejecutándose en http://localhost:${port}/api/user/:id`); 
});

function signIn(email, pass){

  var com = PassService.comparaPassword(pass, contr);

}