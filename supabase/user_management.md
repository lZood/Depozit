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
    *   **Email:** `empleado@depozit.com`
    *   **Contraseña:** Otra contraseña segura.

## Asignación de Roles

Después de crear los usuarios, debes asignarles el rol correcto. Por defecto, todos los usuarios nuevos son `employee`. Para cambiar un usuario a `admin`, sigue estos pasos:

1.  **Ir al Editor de Tablas:** En el menú de la izquierda de Supabase, haz clic en el ícono de la tabla (**Table Editor**).
2.  **Seleccionar la tabla `profiles`:** En la lista de tablas, busca y haz clic en `profiles`.
3.  **Editar el Rol:**
    *   Verás una fila por cada usuario que has creado. La columna `role` dirá `employee` para ambos.
    *   Busca la fila que corresponde al email de tu usuario administrador (ej. `admin@depozit.com`).
    *   Haz doble clic en la celda `role` de esa fila.
    *   Cambia el valor de `employee` a `admin` y presiona Enter o haz clic fuera para guardar.
4.  **¡Listo!** Tu usuario ahora tiene permisos de administrador en la aplicación.
