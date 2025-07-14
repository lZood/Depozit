
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";

export default function SupportPage() {
  const email = "jramirezlopez03@gmail.com";
  const phone = "687 366 8085";
  const whatsappLink = `https://wa.me/5216873668085`;

  return (
    <div className="grid flex-1 auto-rows-max gap-4">
      <Card className="max-w-2xl mx-auto w-full">
        <CardHeader>
          <CardTitle>Contacto de Soporte</CardTitle>
          <CardDescription>
            Si necesitas ayuda, tienes alguna pregunta o quieres reportar un problema, no dudes en contactarme a través de los siguientes medios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            <Mail className="h-6 w-6 text-muted-foreground mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold">Correo Electrónico</h3>
              <p className="text-muted-foreground break-all">{email}</p>
              <Button variant="link" asChild className="p-0 h-auto mt-1">
                <a href={`mailto:${email}`}>Enviar correo</a>
              </Button>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Phone className="h-6 w-6 text-muted-foreground mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold">Teléfono / WhatsApp</h3>
              <p className="text-muted-foreground">{phone}</p>
               <Button variant="link" asChild className="p-0 h-auto mt-1">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  Enviar mensaje por WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
