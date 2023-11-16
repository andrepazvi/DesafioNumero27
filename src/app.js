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
import config from './config/config.js'

const port = config.port
const mongoURL = config.mongoURL
const mongoDBName = config.mongoDBName

const app = express(); 
app.use(express.json()); 
app.use(express.static('./src/public')); 

// configuracion de la sesion
app.use(session({
    store: MongoStore.create({
        mongoUrl: mongoURL,
        dbName: mongoDBName,
        mongoOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true
    }
}),
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))

initializePassport();
app.use(passport.initialize());
app.use(passport.session());

app.engine('handlebars', handlebars.engine());
app.set('views', './src/views');
app.set('view engine', 'handlebars');


try {
    await mongoose.connect(mongoURL) // conecta con la base de datos
    const serverHttp = app.listen(port, () => console.log('server up'))  
    const io = new Server(serverHttp) 
    
    app.use((req, res, next) => {
        req.io = io;
        next();
    }); 
    
    // Rutas
    app.get('/', (req, res) => {
    if (req.session.user) {
        res.render('index');
    } else {
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