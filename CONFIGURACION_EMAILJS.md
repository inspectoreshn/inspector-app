# Configuración de Web3Forms para enviar PDF a Gmail

Web3Forms es GRATUITO, sin límites de tamaño y muy fácil de configurar.

## Paso 1: Obtener tu Access Key (2 minutos)

1. Ve a: **https://web3forms.com/**
2. Haz clic en **"Get Started Free"**
3. Ingresa tu correo Gmail (donde quieres recibir los PDFs)
4. Haz clic en **"Create Access Key"**
5. **COPIA** el Access Key que aparece (algo como: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
6. Revisa tu Gmail y confirma tu correo

## Paso 2: Configurar en la aplicación

Abre el archivo `app.js` y busca la línea 180 aproximadamente:

```javascript
formData.append('access_key', 'TU_ACCESS_KEY_AQUI');
```

Reemplaza `TU_ACCESS_KEY_AQUI` con tu Access Key.

**Ejemplo:**
```javascript
formData.append('access_key', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
```

## ¡Listo!

Ahora cuando guardes un informe:
1. Se descargará el PDF localmente
2. Se enviará automáticamente a tu Gmail con el PDF adjunto
3. El correo llegará a la dirección que registraste en Web3Forms

## Ventajas de Web3Forms:

✅ Completamente GRATIS
✅ Sin límite de tamaño de archivos
✅ Sin límite de correos por mes
✅ Soporta adjuntos PDF
✅ Configuración en 2 minutos
✅ No requiere tarjeta de crédito

## Nota importante:

El PDF se enviará SIEMPRE al correo que registraste en Web3Forms, no al que ingreses en el formulario. Si quieres cambiar el correo destino, necesitas crear un nuevo Access Key con otro correo.

## ¿Necesitas ayuda?

Si tienes problemas, dime en qué paso estás y te ayudo.

