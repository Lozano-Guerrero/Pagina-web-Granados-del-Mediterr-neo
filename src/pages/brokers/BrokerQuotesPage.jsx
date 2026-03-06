import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import {
    Search,
    FileText,
    Download,
    Calendar,
    DollarSign,
    User,
    MapPin,
    LayoutGrid,
    Loader2,
    RefreshCw,
    AlertTriangle,
    Trash2,
    Filter,
    Users,
    List
} from 'lucide-react';
import { generateQuotePdfBytes, downloadPdfBytes, buildQuoteFilename } from '../../lib/quotePdf';
import '../brokers/Brokers.css';
import './QuotesPanel.css';

const currencyFmt = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
});

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default function BrokerQuotesPage() {
    const { profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('client'); // 'all' o 'client'
    const [deleteModal, setDeleteModal] = useState({ open: false, quote: null });

    useEffect(() => {
        if (!authLoading) {
            fetchQuotes();
        }
    }, [profile, authLoading]);

    const fetchQuotes = async () => {
        setLoading(true);
        try {
            console.log('🔍 Iniciando consulta de cotizaciones...');

            // Consultamos sin filtro manual para ver si RLS nos da lo que necesitamos
            // Si las cotizaciones existen y están vinculadas al UID de auth, aparecerán aquí.
            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                console.error('❌ Error fetching quotes:', error);
                throw error;
            }

            console.log('✅ Consulta finalizada. Registros encontrados:', data?.length || 0);
            setQuotes(data || []);
        } catch (err) {
            console.error('Catch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        const quote = deleteModal.quote;
        if (!quote) return;

        try {
            console.log('🗑️ Intentando eliminar de la DB:', quote.id);

            // Realizar el delete filtrando por ID y asegurando que pertenece al broker actual 
            // aunque el RLS ya debería encargarse de ello.
            const { error, count } = await supabase
                .from('quotes')
                .delete({ count: 'exact' }) // Pedimos el conteo exacto para confirmar borrado
                .eq('id', quote.id);

            if (error) {
                console.error("❌ Error Supabase al borrar:", error);
                throw new Error(error.message);
            }

            console.log(`✅ Resultado del borrado: ${count} registros eliminados.`);

            if (count === 0) {
                console.warn('⚠️ No se eliminó ningún registro. Posiblemente por políticas RLS o ID inexistente.');
                alert('No tienes permisos para eliminar este registro o ya no existe.');
            } else {
                // Solo si la DB confirmó el borrado, actualizamos el estado local
                setQuotes(prev => prev.filter(q => q.id !== quote.id));
                console.log('✨ UI actualizada localmente.');
            }

            setDeleteModal({ open: false, quote: null });
        } catch (err) {
            console.error('❌ Error fatal al eliminar:', err);
            alert(`Error: ${err.message || 'No se pudo eliminar la cotización'}`);
        }
    };

    const handleDownload = async (quote) => {
        const pdfUrl = quote.pdf_path;
        console.log('📂 Intentando descargar PDF:', pdfUrl || 'Regenerando...');

        if (pdfUrl) {
            try {
                // Abrir en pestaña nueva primero (es más rápido si ya existe)
                window.open(pdfUrl, '_blank');
                console.log('✅ Comando de apertura enviado.');
            } catch (err) {
                console.error('❌ Error al intentar abrir el PDF:', err);
            }
        } else {
            // REGENERACIÓN ON-THE-FLY
            console.log('🔄 PDF no encontrado en storage. Iniciando regeneración...');
            setLoading(true);
            try {
                const pdfBytes = await generateQuotePdfBytes(quote);
                const filename = buildQuoteFilename(quote);
                downloadPdfBytes(pdfBytes, filename);
                console.log('✅ PDF regenerado y descargado.');
            } catch (err) {
                console.error('❌ Error al regenerar PDF:', err);
                alert('No se pudo abrir ni regenerar el PDF. Los datos podrían estar incompletos.');
            } finally {
                setLoading(false);
            }
        }
    };

    const filteredQuotes = quotes.filter(q => {
        const query = searchQuery.toLowerCase();
        const client = q.lead_name_snapshot?.toLowerCase() || '';
        const lot = String(q.lot_number || '').toLowerCase();
        const id = String(q.id || '').toLowerCase();

        return client.includes(query) || lot.includes(query) || id.includes(query);
    });

    // Lógica de agrupación
    const groupedQuotes = filteredQuotes.reduce((groups, quote) => {
        const clientName = quote.lead_name_snapshot || 'Cliente sin nombre';
        if (!groups[clientName]) {
            groups[clientName] = [];
        }
        groups[clientName].push(quote);
        return groups;
    }, {});

    return (
        <div className="premium-card">
            {/* Header */}
            <div className="brokers-leads-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 className="brokers-title brokers-title-left">Historial de Cotizaciones</h1>
                    <p className="brokers-subtitle brokers-subtitle-left">Gestiona y descarga tus propuestas comerciales.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${activeFilter === 'client' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('client')}
                        >
                            <Users size={16} /> <span>Por Cliente</span>
                        </button>
                        <button
                            className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('all')}
                        >
                            <List size={16} /> <span>Todas</span>
                        </button>
                    </div>
                    <button
                        onClick={() => fetchQuotes()}
                        disabled={loading}
                        className="premium-btn secondary"
                        style={{ minWidth: '140px' }}
                    >
                        {loading ? <Loader2 size={18} className="spin-icon" /> : <RefreshCw size={18} />}
                        <span>Actualizar</span>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="brokers-field" style={{ marginBottom: '24px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                    <input
                        type="text"
                        placeholder="Buscar por folio, cliente o lote..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '44px' }}
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="empty-state">
                    <Loader2 size={48} className="spin-icon" style={{ color: '#ccc', margin: '40px auto' }} />
                    <p style={{ color: '#999', textAlign: 'center' }}>Cargando cotizaciones...</p>
                </div>
            ) : filteredQuotes.length === 0 ? (
                <div className="empty-state">
                    <FileText size={64} style={{ color: '#ddd', marginBottom: '16px' }} />
                    <h3 style={{ fontSize: '1.2rem', color: '#666', marginBottom: '8px' }}>
                        {searchQuery ? 'No coincidencias' : 'Buscando tus cotizaciones...'}
                    </h3>
                    <p style={{ color: '#999', marginBottom: '8px' }}>
                        {searchQuery
                            ? 'Prueba con otros términos de búsqueda.'
                            : 'Si acabas de crear una y no aparece, verifica tu conexión o intenta crear una nueva.'}
                    </p>

                    {/* Debug Info */}
                    <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', color: '#666', marginBottom: '24px', border: '1px solid #eee' }}>
                        <strong>ID Detectado:</strong> {profile?.id || 'No cargado'} <br />
                        <strong>Sesión:</strong> {authLoading ? 'Cargando...' : (profile ? 'Activa' : 'Inactiva')} <br />
                        <strong>Total:</strong> {quotes.length} registros en memoria.
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="premium-btn secondary" onClick={() => fetchQuotes()}>
                            <RefreshCw size={18} /> Reintentar
                        </button>
                        <button
                            className="premium-btn"
                            onClick={() => navigate('/brokers/cotizador')}
                        >
                            <MapPin size={18} /> Ir al Mapa
                        </button>
                    </div>
                </div>
            ) : (
                <div className="quotes-container">
                    {activeFilter === 'client' ? (
                        Object.keys(groupedQuotes).sort().map(clientName => (
                            <div key={clientName} className="client-group">
                                <div className="client-group-header">
                                    <div className="client-avatar-mini">
                                        <Users size={14} />
                                    </div>
                                    <h2>{clientName} <span className="quote-count-badge">{groupedQuotes[clientName].length}</span></h2>
                                </div>
                                <div className="quotes-grid">
                                    {groupedQuotes[clientName].map((quote) => (
                                        <QuoteCard
                                            key={quote.id}
                                            quote={quote}
                                            onDownload={handleDownload}
                                            onDelete={(q) => setDeleteModal({ open: true, quote: q })}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="quotes-grid">
                            {filteredQuotes.map((quote) => (
                                <QuoteCard
                                    key={quote.id}
                                    quote={quote}
                                    onDownload={handleDownload}
                                    onDelete={(q) => setDeleteModal({ open: true, quote: q })}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Premium Confirmation Modal */}
            {deleteModal.open && (
                <div className="modal-overlay">
                    <div className="confirm-modal">
                        <div className="confirm-modal-icon">
                            <AlertTriangle size={32} />
                        </div>
                        <h3>¿Eliminar cotización?</h3>
                        <p>
                            Estás a punto de borrar la cotización del <strong>lote {deleteModal.quote?.lot_number}</strong>.
                            Esta acción es permanente y no se podrá recuperar.
                        </p>
                        <div className="confirm-modal-actions">
                            <button
                                className="btn-modal cancel"
                                onClick={() => setDeleteModal({ open: false, quote: null })}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-modal delete"
                                onClick={handleDelete}
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Subcomponente para la tarjeta de cotización para evitar repetición
function QuoteCard({ quote, onDownload, onDelete }) {
    const currencyFmt = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
    });

    return (
        <div className="quote-card">
            <div className="quote-card-header">
                <div className="quote-icon-compact">
                    <FileText size={20} />
                </div>
                <div className="quote-header-text">
                    <div className="quote-title-line">
                        <h3 className="quote-title-main">
                            Cotización del lote {quote.lot_number}
                        </h3>
                        <span className="quote-folio-tag">
                            {quote.id}
                        </span>
                    </div>
                    <div className="quote-info-chip" style={{ fontSize: '0.75rem' }}>
                        <Calendar size={12} />
                        <span>{formatDate(quote.created_at)}</span>
                    </div>
                </div>
            </div>

            <div className="quote-content-body">
                <div className="quote-info-chip">
                    <User size={14} />
                    <span className="quote-chip-label">Cliente:</span>
                    <span className="quote-chip-value">{quote.lead_name_snapshot}</span>
                </div>

                <div className="quote-info-chip">
                    <LayoutGrid size={14} />
                    <span className="quote-chip-label">Tipo:</span>
                    <span className="quote-chip-value">{quote.lot_typology || '—'} ({quote.tamano_m2} m²)</span>
                </div>

                <div className="quote-price-tag">
                    <span className="quote-chip-label">Inversión Final:</span>
                    <span className="price-main">{currencyFmt.format(quote.costo_final || 0)}</span>
                </div>
            </div>

            <div className="quote-footer-actions">
                <button
                    onClick={() => onDownload(quote)}
                    className="btn-download-compact"
                >
                    <Download size={16} />
                    <span>Descargar PDF</span>
                    {!quote.pdf_path && (
                        <RefreshCw size={14} className="spin-icon regenerate-pulse" />
                    )}
                </button>

                <button
                    onClick={() => onDelete(quote)}
                    className="btn-delete-compact"
                    title="Eliminar cotización"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
