import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const A4 = { width: 595.28, height: 841.89 };

const currencyFmt = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const numberFmt = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
});

const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.+-]/g, ''));
    return Number.isFinite(num) ? num : 0;
};

const safeText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

async function fetchBytes(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`No se pudo cargar asset: ${url}`);
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
}

export function downloadPdfBytes(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export function buildQuoteFilename({ lot_number, id }) {
    const lot = safeText(lot_number || '').replace(/\s+/g, '');
    const safeId = safeText(id || '').replace(/\s+/g, '');
    return `Cotizacion_Lote-${lot || '—'}-${safeId || 'SIN_ID'}.pdf`;
}

export async function generateQuotePdfBytes(quote, options = {}) {
    const logoUrl = options.logoUrl || '/pdf-assets/logo.png';
    const watermarkUrl = options.watermarkUrl || '/pdf-assets/watermark.png';

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([A4.width, A4.height]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 40;
    const width = page.getWidth();
    const height = page.getHeight();

    // Watermark (best-effort)
    try {
        const wmBytes = await fetchBytes(watermarkUrl);
        const wmImg = watermarkUrl.toLowerCase().endsWith('.jpg') || watermarkUrl.toLowerCase().endsWith('.jpeg')
            ? await pdfDoc.embedJpg(wmBytes)
            : await pdfDoc.embedPng(wmBytes);
        const targetW = Math.min(430, width - margin * 2);
        const scale = targetW / wmImg.width;
        const wmW = wmImg.width * scale;
        const wmH = wmImg.height * scale;
        page.drawImage(wmImg, {
            x: (width - wmW) / 2,
            y: (height - wmH) / 2,
            width: wmW,
            height: wmH,
            opacity: 0.09
        });
    } catch {
        // ignore watermark errors
    }

    // Header: logo (best-effort) + ID
    let headerY = height - margin;
    try {
        const logoBytes = await fetchBytes(logoUrl);
        const logoImg = logoUrl.toLowerCase().endsWith('.jpg') || logoUrl.toLowerCase().endsWith('.jpeg')
            ? await pdfDoc.embedJpg(logoBytes)
            : await pdfDoc.embedPng(logoBytes);
        const targetW = 120;
        const scale = targetW / logoImg.width;
        const logoW = logoImg.width * scale;
        const logoH = logoImg.height * scale;
        page.drawImage(logoImg, {
            x: margin,
            y: headerY - logoH,
            width: logoW,
            height: logoH
        });
    } catch {
        // ignore logo errors
    }

    const quoteId = safeText(quote?.id);
    const idText = `ID Cotización: ${quoteId || '—'}`;
    const idSize = 10;
    const idWidth = font.widthOfTextAtSize(idText, idSize);
    page.drawText(idText, {
        x: Math.max(margin, width - margin - idWidth),
        y: headerY - 12,
        size: idSize,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1)
    });

    const title = 'COTIZACION';
    const titleSize = 18;
    const titleWidth = fontBold.widthOfTextAtSize(title, titleSize);
    page.drawText(title, {
        x: (width - titleWidth) / 2,
        y: headerY - 50,
        size: titleSize,
        font: fontBold,
        color: rgb(0.05, 0.05, 0.05)
    });

    // Divider
    page.drawLine({
        start: { x: margin, y: headerY - 60 },
        end: { x: width - margin, y: headerY - 60 },
        thickness: 1,
        color: rgb(0, 0, 0),
        opacity: 0.15
    });

    let y = headerY - 82;

    const sectionTitle = (text) => {
        page.drawText(text, { x: margin, y, size: 12, font: fontBold, color: rgb(0.05, 0.05, 0.05) });
        y -= 10;
        page.drawLine({
            start: { x: margin, y },
            end: { x: width - margin, y },
            thickness: 1,
            color: rgb(0, 0, 0),
            opacity: 0.08
        });
        y -= 16;
    };

    const row = (label, value) => {
        const labelText = safeText(label);
        const valueText = safeText(value) || '—';
        const labelSize = 10;
        const valueSize = 11;
        page.drawText(labelText, { x: margin, y, size: labelSize, font, color: rgb(0.35, 0.35, 0.35) });
        page.drawText(valueText, { x: margin + 160, y, size: valueSize, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        y -= 18;
    };

    const createdAt = quote?.created_at ? new Date(quote.created_at) : null;
    const createdAtText = createdAt ? createdAt.toLocaleDateString('es-MX') : '—';

    sectionTitle('Datos generales');
    row('Fecha', createdAtText);
    row('Cliente', quote?.lead_name_snapshot || '—');
    row('Broker', quote?.broker_name_snapshot || '—');

    y -= 4;
    sectionTitle('Lote');
    row('Lote', quote?.lot_number || '—');
    row('Tipo', quote?.lot_typology || quote?.lot_type || '—');
    row('Tamaño', `${numberFmt.format(toNumber(quote?.tamano_m2))} m²`);
    row('Precio m²', currencyFmt.format(toNumber(quote?.precio_m2)));
    row('Costo total', currencyFmt.format(toNumber(quote?.costo_final)));
    row('Descuento', `${numberFmt.format(toNumber(quote?.descuento))}%`);

    y -= 4;
    sectionTitle('Metodo de pago');
    const method = String(quote?.payment_method || '').toUpperCase();
    const methodLabel = method === 'MSI_44' ? '44 MSI' : '3 anualidades + 40 MSI';
    row('Plan', methodLabel);

    const enganche = toNumber(quote?.enganche_monto);
    const mensualidad = toNumber(quote?.mensualidad_monto);
    const mensualidadesNum = toNumber(quote?.mensualidades_num) || (method === 'MSI_44' ? 44 : 40);

    row('Enganche', currencyFmt.format(enganche));

    if (method !== 'MSI_44') {
        const anualidad = toNumber(quote?.anualidad_monto);
        const contra = toNumber(quote?.pago_escritura_monto);
        row('Anualidad', currencyFmt.format(anualidad));
        row('Total 3 anualidades', currencyFmt.format(anualidad * 3));
        row('Pago contra escritura', currencyFmt.format(contra));
        row(`${mensualidadesNum} mensualidades`, currencyFmt.format(mensualidad));
    } else {
        row(`${mensualidadesNum} mensualidades`, currencyFmt.format(mensualidad));
    }

    // Calendario / cascada de pagos (informativo, sin montos)
    y -= 4;
    const scheduleTitle = 'Calendario de pagos';
    page.drawText(scheduleTitle, { x: margin, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    y -= 14;
    const scheduleItems = method === 'MSI_44'
        ? [
            'Separación + Enganche',
            '44 mensualidades sin intereses'
        ]
        : [
            'Separación + Enganche',
            '12 mensualidades',
            'Anualidad',
            '12 mensualidades',
            'Anualidad',
            '12 mensualidades',
            '4 mensualidades',
            'Pago contra escritura'
        ];
    const scheduleSize = 9.5;
    scheduleItems.forEach((item, idx) => {
        const line = `${idx + 1}. ${item}`;
        page.drawText(line, {
            x: margin + 6,
            y,
            size: scheduleSize,
            font,
            color: rgb(0.25, 0.25, 0.25),
            maxWidth: width - margin * 2 - 12
        });
        y -= 12;
    });

    // Footer disclaimer
    const footerLine1 = '*La cotización puede contener errores.';
    const footerLine2 = '**La cotización no asegura el precio, el precio se asegura mediante la separación de $20,000.00.';
    const footerSize = 9;
    const footerY = margin - 2;
    page.drawLine({
        start: { x: margin, y: footerY + 28 },
        end: { x: width - margin, y: footerY + 28 },
        thickness: 1,
        color: rgb(0, 0, 0),
        opacity: 0.08
    });
    page.drawText(footerLine1, {
        x: margin,
        y: footerY + 18,
        size: footerSize,
        font,
        color: rgb(0.28, 0.28, 0.28),
        maxWidth: width - margin * 2
    });
    page.drawText(footerLine2, {
        x: margin,
        y: footerY + 6,
        size: footerSize,
        font,
        color: rgb(0.28, 0.28, 0.28),
        maxWidth: width - margin * 2
    });

    return pdfDoc.save();
}
