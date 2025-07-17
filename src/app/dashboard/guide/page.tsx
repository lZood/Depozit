
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package,
  ShoppingCart,
  Camera,
  LayoutGrid,
  ArrowRightLeft,
  Truck,
  Sparkles,
  User,
  CreditCard,
  PlusCircle,
  Pencil,
} from "lucide-react";

export default function GuidePage() {
  return (
    <div className="grid flex-1 auto-rows-max gap-6 md:gap-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Guía de Usuario de Depozit</h1>
        <p className="text-lg text-muted-foreground">
          ¡Bienvenido! Esta guía te ayudará a entender cómo gestionar tu negocio
          de forma eficiente con nuestro sistema.
        </p>
      </div>

      {/* Módulo de Inventario */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Módulo de Inventario</CardTitle>
              <CardDescription>
                Todo lo que necesitas para mantener tus productos organizados y
                tu stock al día.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-base">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <PlusCircle className="h-5 w-5" /> 1. Agregar y Editar Productos
            </h3>
            <p>
              El corazón de tu inventario. Ve a la sección **Productos**. Para
              agregar uno nuevo, haz clic en el botón **"Agregar"**.
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>
                <strong>Nombre, SKU, Precio de Venta:</strong> Son los campos más
                importantes. Asegúrate de que el SKU sea único.
              </li>
              <li>
                <strong>Existencias Iniciales:</strong> Coloca la cantidad actual
                que tienes del producto.
              </li>
              <li>
                <strong>Estado:</strong> "Activo" para que aparezca en la venta,
                "Borrador" si aún no está listo.
              </li>
            </ul>
          </div>

          <div className="space-y-2 p-4 border-l-4 border-accent bg-accent/10 rounded-r-lg">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Camera className="h-5 w-5 text-accent" /> ¡Toma Buenas Fotos!
            </h3>
            <p>
              Una buena imagen ayuda a identificar productos rápidamente,
              especialmente en la pantalla de venta. Sigue estos consejos:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>
                <strong>Fondo Limpio:</strong> Usa un fondo simple (blanco o de un
                solo color) para que el producto destaque.
              </li>
              <li>
                <strong>Buena Iluminación:</strong> La luz natural es la mejor.
                Evita sombras fuertes.
              </li>
              <li>
                <strong>Enfoque Claro:</strong> Asegúrate de que la imagen sea
                nítida y muestre los detalles del producto.
              </li>
              <li>
                <strong>Usa la Cámara del Celular:</strong> Puedes subir la foto
                directamente desde tu teléfono al crear o editar un producto.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" /> 2. Organizar por Categorías
            </h3>
            <p>
              Ve a **Categorías** para agrupar tus productos (ej. "Bebidas",
              "Snacks"). Esto te ayudará a tener reportes más claros y a
              encontrar cosas más rápido.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" /> 3. Ajustes de Stock
            </h3>
            <p>
              En la sección **Inventario**, puedes ajustar las existencias. Esto
              es útil para registrar productos dañados, mermas o devoluciones
              que no son por una venta directa. Simplemente busca el producto,
              haz clic en **"Ajustar Stock"** y especifica si es una entrada o
              una salida y el motivo.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" /> 4. Órdenes de Compra
            </h3>
            <p>
              Cuando necesites reponer mercancía, ve a **Órdenes de Compra** y
              crea una nueva. Asigna un proveedor y los productos que vas a
              pedir. Cuando recibas la mercancía, marca la orden como
              **"Recibida"** y el stock de esos productos se actualizará
              automáticamente. ¡Así de fácil!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Módulo de Ventas */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Módulo de Ventas (Punto de Venta)</CardTitle>
              <CardDescription>
                El proceso para registrar una venta es rápido e intuitivo.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-base">
            <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5" /> 1. Pantalla de "Vender"
                </h3>
                <p>
                    Esta es tu área de trabajo principal. Aquí agregarás productos al
                    carrito de la venta actual. Puedes usar el buscador o el acceso
                    rápido.
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>
                    <strong>Buscador:</strong> Escribe el nombre, SKU o escanea el código
                    de barras de un producto. Presiona "Enter" para agregarlo
                    rápidamente si solo hay un resultado.
                    </li>
                    <li>
                    <strong>Acceso Rápido:</strong> Los productos que marques como
                    "destacados" (con una estrella en la página de Productos)
                    aparecerán aquí para que los agregues con un solo clic.
                    </li>
                </ul>
            </div>
             <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <User className="h-5 w-5" /> 2. Asignar un Cliente (Opcional)
                </h3>
                <p>
                    En el panel de la venta, puedes hacer clic en **"Asignar Cliente"** para
                    relacionar la venta con alguien de tu base de datos. Esto es muy
                    útil para los reportes y para saber quiénes son tus mejores
                    clientes.
                </p>
            </div>
             <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" /> 3. Procesar el Pago
                </h3>
                <p>
                    Una vez que todos los productos estén en el carrito, el total se
                    calculará automáticamente. Simplemente elige el método de pago
                    (Efectivo o Tarjeta) para finalizar la venta. El sistema
                    descontará el stock y registrará la transacción.
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
