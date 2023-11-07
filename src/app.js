import express from 'express'
import { Server } from 'socket.io'
import handlebars from 'express-handlebars'
import productsRouter from './routers/products.router.js'
import cartsRouter from './routers/carts.router.js'
import viewsRouter from './routers/views.router.js'
import chatRouter from './routers/chat.router.js'
import sessionsRouter from './routers/sessions.router.js'
import viewsUserRouter from './routers/viewsUser.router.js'
import mongoose from 'mongoose'
import Message from './dao/models/message.model.js'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import passport from 'passport'
import initializePassport from './config/passport.config.js'

const PORT = 8080;

const app = express();
app.use(express.json()); 
app.use(express.static('./src/public')); 

app.use(session({
  store: MongoStore.create({
    mongoUrl: 'mongodb+srv://andreapazvilla:andrepaz123@cluster0.2rfi0oa.mongodb.net/?retryWrites=true&w=majority',
    dbName: 'newproyect',
  }),
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}))

// configuracion de passport
initializePassport();
app.use(passport.initialize());
app.use(passport.session());

// configuracion del motor de plantillas handlebars
app.engine('handlebars', handlebars.engine());
app.set('views', './src/views');
app.set('view engine', 'handlebars');


// Inicialización del servidor
try {
    await mongoose.connect('mongodb+srv://andreapazvilla:andrepaz123@cluster0.2rfi0oa.mongodb.net/?retryWrites=true&w=majority') 
    const serverHttp = app.listen(PORT, () => console.log('server up')) 
    const io = new Server(serverHttp)
    
    app.use((req, res, next) => {
        req.io = io;
        next();
    }); 
    
    // Rutas
    app.get('/', (req, res) => {
      if (req.session.user) {
          // Si el usuario ya está autenticado, redireccionar a la vista de productos
          res.render('index');
      } else {
          // Si el usuario no ha iniciado sesión, redireccionar a la vista de inicio de sesión
          res.redirect('/login');
      }
    })
    
    app.use('/', viewsUserRouter); // registra el router de usuario en la ruta /
    app.use('/chat', chatRouter); // ruta para renderizar la vista de chat
    app.use('/products', viewsRouter); // ruta para renderizar la vista de productos
    app.use('/api/products', productsRouter); // registra el router de productos en la ruta /api/products
    app.use('/api/carts', cartsRouter); // registra el router de carritos en la ruta /api/carts
    app.use('/api/sessions', sessionsRouter); // registra el router de sesiones en la ruta /api/sessions
    
    io.on('connection', socket => {
        console.log('Nuevo cliente conectado!')

        socket.broadcast.emit('Alerta');

        // Cargar los mensajes almacenados en la base de datos
        Message.find()
          .then(messages => {
            socket.emit('messages', messages); 
          })
          .catch(error => {
            console.log(error.message);
          });
    
        socket.on('message', data => {
          // Guardar el mensaje en la base de datos
          const newMessage = new Message({
            user: data.user,
            message: data.message
          });
    
          newMessage.save()
            .then(() => {
              // Emitir el evento messages con los mensajes actualizados de la base de datos
              Message.find()
                .then(messages => {
                  io.emit('messages', messages);
                })
                .catch(error => {
                  console.log(error.message);
                });
            })
            .catch(error => {
              console.log(error.message);
            });
        });

        socket.on('productList', async (data) => { 
            io.emit('updatedProducts', data ) 
        }) 
    }) 
} catch (error) {
    console.log(error.message)
}
