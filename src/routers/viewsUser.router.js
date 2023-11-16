import { Router } from "express";
import { isAuthenticated } from "../public/js/authMiddleware.js";
import { 
    viewsUserRegisterController,
    viewsUserLoginController,
    viewsUserProfileController,
    viewsUserLogoutController 
} from "../controllers/viewsUser.controller.js";

const router = Router();

router.get('/register', viewsUserRegisterController); // Ruta para el registro de usuario

router.get('/login', viewsUserLoginController); // Ruta para el inicio de sesión de usuario

router.get('/profile', isAuthenticated, viewsUserProfileController); // Ruta para el perfil del usuario

router.get('/logout', isAuthenticated, viewsUserLogoutController); // Ruta para cerrar sesión

export default router;