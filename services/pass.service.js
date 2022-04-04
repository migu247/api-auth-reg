'use strict'

const bcrypt = require('bcrypt');

// ecriptaPass
//
// devuelve hash con salt incluido formato:
//      $2b$10$9aCAVDEsbc5blE/OT4EnP.V1FZKfHMnVx4QkgZ6OFf9KDWLwUrd1S
//      ***---***********************+++++++++++++++++++++++++++++++
//      Alg Cost        Salt                    Hash

function encriptaPassword(password){
    return bcrypt.hash(password, 10);
}

//comparaPassword
//
//Devolver verdadero o falso si coinciden el pass y el hash

function comparaPassword(password, hash){
    return bcrypt.compare(password, hash);
}

module.exports = {
    encriptaPassword,
    comparaPassword
};
