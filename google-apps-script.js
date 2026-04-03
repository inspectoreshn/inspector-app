// ============================================================
// GOOGLE APPS SCRIPT - Inspector App
// Pega este código en script.google.com
// ============================================================

const CARPETA_NOMBRE = 'Reportes Inspector App';
const CORREO_DESTINO = 'galdamezalberto2000@gmail.com';
const HOJA_NOMBRE    = 'Reportes';

// Campos que contienen imágenes en base64
const CAMPOS_FOTO = ['Foto_Factura', 'Foto_Moto', 'Foto_Medidor', 'Foto_Fachada', 'Foto_Error'];

// ── Obtener o crear la hoja de cálculo ──────────────────────
function obtenerHoja() {
  const nombre = 'Inspector App - Reportes';
  const archivos = DriveApp.getFilesByName(nombre);
  let ss;
  if (archivos.hasNext()) {
    ss = SpreadsheetApp.open(archivos.next());
  } else {
    ss = SpreadsheetApp.create(nombre);
  }
  let hoja = ss.getSheetByName(HOJA_NOMBRE);
  if (!hoja) {
    hoja = ss.insertSheet(HOJA_NOMBRE);
    // Cabecera
    hoja.appendRow([
      'ID', 'Fecha Registro', 'Módulo', 'Inspector', 'Usuario',
      'Fecha', 'Clave', 'N° Medidor', 'Observaciones',
      'Latitud', 'Longitud', 'Google Maps',
      'Km Inicial', 'Km Final', 'Km Recorridos',
      'Tipo Gasto', 'Descripción', 'Valor', 'Identidad',
      'Lectura Correcta', 'Lectura Incorrecta',
      'Contiguo', 'Cantidad Fotos',
      'Foto 1', 'Foto 2', 'Foto 3', 'Foto 4', 'Foto 5', 'Foto 6', 'Foto 7',
      'PDF'
    ]);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

// ── Guardar reporte en Sheets ────────────────────────────────
function guardarEnSheets(datos, enlacesFotos, enlacePDF) {
  try {
    const hoja = obtenerHoja();
    const fotoUrls = enlacesFotos.map(f => f.url);
    while (fotoUrls.length < 7) fotoUrls.push('');

    hoja.appendRow([
      Date.now(),
      new Date().toLocaleString('es-HN'),
      datos.tipo        || datos.Modulo       || '',
      datos.Inspector   || datos.inspector    || datos.Usuario || datos.usuario || '',
      datos.Usuario     || datos.usuario      || '',
      datos.Fecha       || datos.Fecha_Generacion || '',
      datos.Clave       || '',
      datos.Numero_Medidor || '',
      datos.Observaciones  || '',
      datos.Latitud     || '',
      datos.Longitud    || '',
      datos.Google_Maps || '',
      datos.Km_Inicial  || '',
      datos.Km_Final    || '',
      datos.Km_Recorridos || '',
      datos.Tipo_Gasto  || '',
      datos.Descripcion || '',
      datos.Valor       || '',
      datos.Identidad   || '',
      datos.Lectura_Correcta   || '',
      datos.Lectura_Incorrecta || '',
      datos.Contiguo    || '',
      datos.Cantidad_Fotos || enlacesFotos.length,
      ...fotoUrls,
      enlacePDF || ''
    ]);
  } catch(err) {
    Logger.log('Error guardando en Sheets: ' + err.message);
  }
}

// ── doPost: recibe reportes y consultas del supervisor ───────
function doPost(e) {
  try {
    const raw = e.postData ? e.postData.contents : '{}';
    const datos = JSON.parse(raw);

    // Consultas del supervisor
    if (datos.accion === 'obtenerReportes')   return responderReportes(datos);
    if (datos.accion === 'obtenerAsistencia') return responderHoja('Asistencia', datos);
    if (datos.accion === 'obtenerDotacion')   return responderHoja('Dotacion', datos);
    if (datos.accion === 'obtenerCharlas')    return responderHoja('Charlas', datos);

    // Guardar asistencia
    if (datos.accion === 'guardarAsistencia') return guardarEnHojaSimple('Asistencia', datos.registros, ['Fecha','Inspector','Sede','Estado','Motivo','Hora']);

    // Guardar dotación
    if (datos.accion === 'guardarDotacion') return guardarEnHojaSimple('Dotacion', [datos], ['Fecha','Inspector','Sede','Camisa','Sombrero','Burros','Pantalon','Termico','Carnet','Licencia','Revision','Volantes','Binocular','Observaciones','Foto_URL']);

    // Guardar charla
    if (datos.accion === 'guardarCharla') {
      const carpeta = obtenerCarpeta(CARPETA_NOMBRE);
      const fotos = [];
      ['foto1','foto2'].forEach(k => {
        if (datos[k] && datos[k].startsWith('data:image')) {
          try {
            const b64 = datos[k].replace(/^data:image\/\w+;base64,/, '');
            const blob = Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', `charla_${k}_${formatearFecha()}.jpg`);
            const f = carpeta.createFile(blob);
            f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            fotos.push(`https://drive.google.com/thumbnail?id=${f.getId()}&sz=w600`);
          } catch(err) { fotos.push(''); }
          delete datos[k];
        } else { fotos.push(''); }
      });
      return guardarEnHojaSimple('Charlas', [{
        Fecha: datos.fecha, Hora: datos.hora, Sede: datos.sede,
        Tema: datos.tema, Latitud: datos.lat||'', Longitud: datos.lng||'',
        Foto1: fotos[0]||'', Foto2: fotos[1]||''
      }], ['Fecha','Hora','Sede','Tema','Latitud','Longitud','Foto1','Foto2']);
    }

    // Reporte normal de inspector
    const tipo = datos.tipo || 'Reporte';
    const carpeta = obtenerCarpeta(CARPETA_NOMBRE);

    const enlacesFotos = [];
    Object.keys(datos).forEach(campo => {
      const val = datos[campo];
      if (val && typeof val === 'string' && val.startsWith('data:image')) {
        try {
          const base64 = val.replace(/^data:image\/\w+;base64,/, '');
          const imgBlob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/jpeg', `${campo}_${formatearFecha()}.jpg`);
          const imgFile = carpeta.createFile(imgBlob);
          imgFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          const urlVer = `https://drive.google.com/thumbnail?id=${imgFile.getId()}&sz=w600`;
          enlacesFotos.push({ label: campo.replace(/_/g, ' '), url: urlVer, base64: val });
          delete datos[campo];
        } catch(imgErr) { Logger.log('Error foto ' + campo + ': ' + imgErr.message); }
      }
    });

    const htmlContent = generarHTML(datos, enlacesFotos);
    const pdfBlob = Utilities.newBlob(htmlContent, 'text/html').getAs('application/pdf');
    const nombreArchivo = `${tipo}_${datos.Usuario || datos.Inspector || 'inspector'}_${formatearFecha()}.pdf`;
    pdfBlob.setName(nombreArchivo);
    const archivo = carpeta.createFile(pdfBlob);
    archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const enlacePDF = archivo.getUrl();

    guardarEnSheets(datos, enlacesFotos, enlacePDF);

    const asunto = `${tipo} - ${datos.Usuario || datos.Inspector || 'Inspector'} - ${formatearFecha()}`;
    GmailApp.sendEmail(CORREO_DESTINO, asunto, '', { htmlBody: generarCorreoHTML(datos, enlacePDF, nombreArchivo, enlacesFotos) });

    return ContentService.createTextOutput(JSON.stringify({ success: true, enlace: enlacePDF })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('Error general: ' + err.message);
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Guardar en hoja simple ───────────────────────────────────
function guardarEnHojaSimple(nombreHoja, filas, cabecera) {
  try {
    const ss = obtenerSpreadsheet();
    let hoja = ss.getSheetByName(nombreHoja);
    if (!hoja) {
      hoja = ss.insertSheet(nombreHoja);
      hoja.appendRow(cabecera);
      hoja.setFrozenRows(1);
    }
    filas.forEach(fila => {
      hoja.appendRow(cabecera.map(c => fila[c] !== undefined ? fila[c] : ''));
    });
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Responder datos de hoja simple ──────────────────────────
function responderHoja(nombreHoja, filtros) {
  try {
    const ss = obtenerSpreadsheet();
    const hoja = ss.getSheetByName(nombreHoja);
    if (!hoja) return ContentService.createTextOutput(JSON.stringify({ success: true, datos: [] })).setMimeType(ContentService.MimeType.JSON);
    const vals = hoja.getDataRange().getValues();
    if (vals.length <= 1) return ContentService.createTextOutput(JSON.stringify({ success: true, datos: [] })).setMimeType(ContentService.MimeType.JSON);
    const cab = vals[0];
    let filas = vals.slice(1).map(f => { const o = {}; cab.forEach((c,i) => o[c] = f[i]||''); return o; });
    if (filtros.fecha) filas = filas.filter(r => (r['Fecha']||'').toString().includes(filtros.fecha));
    filas.reverse();
    return ContentService.createTextOutput(JSON.stringify({ success: true, datos: filas.slice(0,500) })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function obtenerSpreadsheet() {
  const nombre = 'Inspector App - Reportes';
  const archivos = DriveApp.getFilesByName(nombre);
  if (archivos.hasNext()) return SpreadsheetApp.open(archivos.next());
  return SpreadsheetApp.create(nombre);
}

// ── Responder consulta del supervisor ───────────────────────
function responderReportes(filtros) {
  try {
    const hoja = obtenerHoja();
    const datos = hoja.getDataRange().getValues();
    if (datos.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, reportes: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const cabecera = datos[0];
    let filas = datos.slice(1).map(fila => {
      const obj = {};
      cabecera.forEach((col, i) => { obj[col] = fila[i] || ''; });
      return obj;
    });

    // Aplicar filtros
    if (filtros.modulo)    filas = filas.filter(r => r['Módulo'] && r['Módulo'].toString().toLowerCase().includes(filtros.modulo.toLowerCase()));
    if (filtros.inspector) filas = filas.filter(r => r['Inspector'] && r['Inspector'].toString().toLowerCase().includes(filtros.inspector.toLowerCase()));
    if (filtros.fecha)     filas = filas.filter(r => r['Fecha'] && r['Fecha'].toString().includes(filtros.fecha));

    // Ordenar más reciente primero
    filas.reverse();

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, reportes: filas.slice(0, 200) }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Permite que el supervisor consulte via GET también
  if (e.parameter && e.parameter.accion === 'obtenerReportes') {
    return responderReportes(e.parameter);
  }
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function obtenerCarpeta(nombre) {
  const carpetas = DriveApp.getFoldersByName(nombre);
  if (carpetas.hasNext()) return carpetas.next();
  return DriveApp.createFolder(nombre);
}

function formatearFecha() {
  const now = new Date();
  return Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd-MM-yyyy_HH-mm');
}

function generarHTML(d, fotos) {
  const filas = Object.entries(d)
    .filter(([k]) => k !== 'tipo')
    .map(([k, v]) => {
      const label = k.replace(/_/g, ' ');
      const valor = v && v.toString().startsWith('http')
        ? `<a href="${v}" style="color:#2563eb;">${v}</a>`
        : (v || 'No registrado');
      return `<tr>
        <td style="padding:8px 12px;font-weight:600;color:#374151;background:#f9fafb;border:1px solid #e5e7eb;width:40%">${label}</td>
        <td style="padding:8px 12px;color:#111827;border:1px solid #e5e7eb;">${valor}</td>
      </tr>`;
    }).join('');

  const seccionFotos = fotos.length > 0 ? `
    <div style="padding:24px 32px;">
      <h2 style="color:#1e3a8a;font-size:16px;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">Fotografías</h2>
      <div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:16px;">
        ${fotos.map(f => `
          <div style="text-align:center;">
            <p style="font-weight:600;color:#374151;margin:0 0 6px;">${f.label}</p>
            <img src="${f.base64}" style="max-width:250px;max-height:250px;border-radius:8px;border:1px solid #e5e7eb;">
          </div>`).join('')}
      </div>
    </div>` : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    body{font-family:Arial,sans-serif;margin:0;padding:0;background:#f3f4f6;}
    .wrap{max-width:700px;margin:0 auto;background:white;}
    .header{background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:32px;text-align:center;}
    .header h1{color:white;margin:0;font-size:24px;}
    .header p{color:rgba(255,255,255,0.8);margin:8px 0 0;}
    .body{padding:32px;}
    table{width:100%;border-collapse:collapse;margin-top:16px;}
    .footer{text-align:center;padding:20px;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;}
  </style></head><body><div class="wrap">
  <div class="header">
    <h1>${d.tipo || 'Reporte'}</h1>
    <p>Inspector App — ${formatearFecha().replace('_',' ')}</p>
  </div>
  <div class="body"><table>${filas}</table></div>
  ${seccionFotos}
  <div class="footer">Generado automáticamente por Inspector App</div>
  </div></body></html>`;
}

function generarCorreoHTML(d, enlace, nombre, fotos) {
  const filas = Object.entries(d)
    .filter(([k]) => k !== 'tipo')
    .map(([k, v]) => {
      const label = k.replace(/_/g, ' ');
      const valor = v && v.toString().startsWith('http')
        ? `<a href="${v}" style="color:#2563eb;">${v}</a>`
        : (v || 'No registrado');
      return `<tr>
        <td style="padding:8px 12px;font-weight:600;color:#374151;background:#f9fafb;border:1px solid #e5e7eb;width:40%">${label}</td>
        <td style="padding:8px 12px;color:#111827;border:1px solid #e5e7eb;">${valor}</td>
      </tr>`;
    }).join('');

  const miniaturasHTML = fotos.length > 0 ? `
    <div style="margin-top:20px;">
      <p style="font-weight:700;color:#374151;margin-bottom:12px;">Fotografías:</p>
      <div style="display:flex;flex-wrap:wrap;gap:12px;">
        ${fotos.map(f => `
          <div style="text-align:center;">
            <p style="font-size:12px;color:#6b7280;margin:0 0 4px;">${f.label}</p>
            <a href="${f.url}" target="_blank">
              <img src="${f.base64}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;border:2px solid #e5e7eb;">
            </a>
          </div>`).join('')}
      </div>
    </div>` : '';

  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:28px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:white;margin:0;font-size:22px;">${d.tipo || 'Reporte'}</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Inspector App</p>
  </div>
  <div style="background:white;padding:28px;border:1px solid #e5e7eb;">
    <table style="width:100%;border-collapse:collapse;">${filas}</table>
    ${miniaturasHTML}
    <div style="text-align:center;margin-top:24px;">
      <a href="${enlace}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">
        Descargar PDF completo
      </a>
    </div>
  </div>
  <div style="text-align:center;padding:16px;color:#9ca3af;font-size:12px;">
    Generado automáticamente · ${nombre}
  </div></div>`;
}
