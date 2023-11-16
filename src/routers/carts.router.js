import { Router } from "express";
import Cart from '../dao/models/cart.model.js';
import Product from '../dao/models/product.model.js';
import { 
    readCartsController, 
    readCartController, 
    createCartController, 
    addProductCartController, 
    updateProductsCartController,
    updateProductCartController,
    deleteProductCartController,
    deleteProductsCartController 
} from "../controllers/cart.controller.js";

const router = Router();


router.get('/', readCartsController); // Devuelve todos los carritos

router.get('/:cid', readCartController); // Devuelve un carrito según su id

router.post('/', createCartController); // Crea un carrito

router.post('/:cid/product/:pid', addProductCartController); // Agrega un producto al carrito

router.put('/:cid', updateProductsCartController); // Actualiza el carrito con un arreglo de productos

router.put('/:cid/products/:pid', updateProductCartController); 

router.delete('/:cid', deleteProductsCartController); // Vacía el carrito

router.delete('/:cid/products/:pid', deleteProductCartController); 

export default router;