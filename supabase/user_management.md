# Creación de Usuarios en Supabase

Para crear los usuarios para tu aplicación, sigue estos pasos directamente en tu panel de control de Supabase. Esto te da control total y es la forma más segura de gestionar los usuarios.

## Pasos para Crear un Usuario

1.  **Ir al Panel de Supabase:** Abre tu proyecto en [supabase.com](https://supabase.com).
2.  **Navegar a Autenticación:** En el menú de la izquierda, haz clic en el ícono de la persona que dice **Authentication**.
3.  **Añadir Usuario:** Haz clic en el botón **"Add user"** que se encuentra en la parte superior.
4.  **Rellenar el Formulario:**
    *   **Email:** Ingresa el correo electrónico del usuario.
    *   **Password:** Crea una contraseña segura para el usuario. Supabase te puede generar una automáticamente.
    *   Deja las demás opciones con sus valores por defecto por ahora.
5.  **Crear Usuario:** Haz clic en el botón **"Create user"**. El usuario aparecerá en la lista.

## Usuarios a Crear

Te recomiendo crear los siguientes dos usuarios para que podamos seguir desarrollando la aplicación:

1.  **Usuario Administrador:**
    *   **Email:** `admin@depozit.com`
    *   **Contraseña:** Una contraseña segura que recuerdes.

2.  **Usuario Empleado:**
    *   **Email:** `empleado@depoziv.com`
    *   **Contraseña:** Otra contraseña segura.

## Siguientes Pasos

Por ahora, ambos usuarios tendrán los mismos permisos. El siguiente paso importante será implementar un sistema de roles para que el **administrador** tenga más privilegios que el **empleado**. ¡Podemos trabajar en eso a continuación!
