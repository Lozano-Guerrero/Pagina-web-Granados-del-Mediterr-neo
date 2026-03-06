import { supabase } from './supabaseClient';

/**
 * Uploads a PDF buffer to Supabase Storage and returns the public URL.
 * @param {Uint8Array} pdfBytes - The PDF binary data
 * @param {string} fileName - The desired file name (path in bucket)
 * @param {string} bucketName - The storage bucket name (default: 'quotes')
 * @returns {Promise<string|null>} - The public URL or null if error
 */
export async function uploadQuotePdf(pdfBytes, fileName, bucketName = 'quotes') {
    try {
        if (!supabase) throw new Error("Supabase client not initialized");

        // 1. Upload file
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, pdfBytes, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (error) {
            console.error('Error uploading PDF:', error);
            // Si el error es que el bucket no existe, podríamos intentar crearlo si tuviéramos permisos,
            // pero por ahora solo logueamos.
            return null;
        }

        // 2. Get public URL
        const { data: publicData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return publicData.publicUrl;
    } catch (err) {
        console.error('Unexpected error uploading PDF:', err);
        return null;
    }
}
