import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
    Users,
    Clock,
    CheckCircle,
    XCircle,
    Phone,
    MapPin,
    Calendar,
    AlertCircle,
    FilePlus,
    Trash2
} from 'lucide-react';
import './Pipeline.css';

const STAGES = {
    VIGENTE: { id: 'VIGENTE', title: 'Prospectos', icon: Users, color: '#64748b' },
    REUNION: { id: 'REUNION', title: 'Cita / Separado', icon: Calendar, color: '#f59e0b' },
    CERRADO: { id: 'CERRADO', title: 'Venta Ganada', icon: CheckCircle, color: '#10b981' },
    EXPIRADO: { id: 'EXPIRADO', title: 'Venta Perdida', icon: XCircle, color: '#ef4444' }
};

const STAGE_ORDER = ['VIGENTE', 'REUNION', 'CERRADO', 'EXPIRADO'];

function LeadCard({ lead, index, onQuote, onDelete }) {
    const daysLeft = lead.expires_at ? Math.ceil((new Date(lead.expires_at) - new Date()) / (1000 * 60 * 60 * 24)) : null;

    return (
        <Draggable draggableId={String(lead.id)} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`lead-card-kanban ${snapshot.isDragging ? 'is-dragging' : ''}`}
                >
                    <div className="lead-card-header">
                        <span className="lead-card-tag">{lead.lot_number ? `Lote ${lead.lot_number}` : 'Sin Lote'}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {daysLeft !== null && lead.lead_state !== 'CERRADO' && lead.lead_state !== 'EXPIRADO' && (
                                <span className={`lead-card-days ${daysLeft > 2 ? 'safe' : (daysLeft <= 1 ? 'danger' : 'warning')}`}>
                                    {daysLeft <= 0 ? 'Vencido' : `${daysLeft}d`}
                                </span>
                            )}
                            <button className="card-delete-btn" onClick={() => onDelete(lead)} title="Eliminar Prospecto">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                    <span className="lead-card-name">{lead.lead_first_name} {lead.lead_last_name}</span>

                    <div className="lead-card-details-mini">
                        <div className="detail-item">
                            <span className="label">Esquema</span>
                            <span className="value">{lead.esquema || '—'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Régimen</span>
                            <span className="value">{lead.regimen || '—'}</span>
                        </div>
                    </div>
                    <div className="lead-card-meta">
                        <Phone size={12} />
                        <span>{lead.lead_phone || 'Sin tel.'}</span>
                    </div>
                    {lead.lead_state !== 'CERRADO' && lead.lead_state !== 'EXPIRADO' && (
                        <div className="lead-card-actions-quick">
                            <button className="quick-quote-btn" onClick={() => onQuote(lead)} title="Generar Cotización">
                                <FilePlus size={14} /> Crear Cotización
                            </button>
                        </div>
                    )}
                </div>
            )}
        </Draggable>
    );
}

export default function PipelineBoard({ leads, onMoveLead, onQuoteLead, onDeleteLead, loading }) {
    const [boardData, setBoardData] = useState({});

    useEffect(() => {
        const columns = {
            VIGENTE: [],
            REUNION: [],
            CERRADO: [],
            EXPIRADO: []
        };

        leads.forEach(lead => {
            const status = (lead.lead_state || 'VIGENTE').toUpperCase();
            if (columns[status]) {
                columns[status].push(lead);
            } else {
                columns.VIGENTE.push(lead); // Por defecto si el estado es desconocido
            }
        });

        setBoardData(columns);
    }, [leads]);

    const onDragEnd = (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const sourceColId = source.droppableId;
        const destColId = destination.droppableId;

        // Actualización optimista local
        const sourceData = [...boardData[sourceColId]];
        const destData = [...boardData[destColId]];
        const [movedLead] = sourceData.splice(source.index, 1);

        if (sourceColId === destColId) {
            sourceData.splice(destination.index, 0, movedLead);
            setBoardData({ ...boardData, [sourceColId]: sourceData });
        } else {
            destData.splice(destination.index, 0, movedLead);
            setBoardData({
                ...boardData,
                [sourceColId]: sourceData,
                [destColId]: destData
            });
            // Disparar acción real
            onMoveLead(draggableId, sourceColId, destColId);
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="pipeline-board">
                {STAGE_ORDER.map(stageId => {
                    const stage = STAGES[stageId];
                    const columnLeads = boardData[stageId] || [];
                    const Icon = stage.icon;

                    return (
                        <div key={stageId} className="pipeline-column">
                            <div className="column-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Icon size={18} color={stage.color} />
                                    <h3>{stage.title}</h3>
                                </div>
                                <span className="column-count">{columnLeads.length}</span>
                            </div>
                            <Droppable droppableId={stageId}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`column-list ${snapshot.isDraggingOver ? 'is-dragging-over' : ''}`}
                                    >
                                        {columnLeads.map((lead, index) => (
                                            <LeadCard key={lead.id} lead={lead} index={index} onQuote={onQuoteLead} onDelete={onDeleteLead} />
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );
}
