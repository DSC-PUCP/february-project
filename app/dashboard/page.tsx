'use client';

import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getEventsByOrgId, deleteEvent } from '@/lib/actions/events';
import Link from 'next/link';
import type { Event } from '@/lib/types';

export default function DashboardPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [deleteModalEvent, setDeleteModalEvent] = useState<Event | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (!session?.user) {
            router.push('/login');
        }
    }, [session, router]);

    useEffect(() => {
        if (!session?.user || session.user.role === 'admin') return;
        setEventsLoading(true);
        getEventsByOrgId(session.user.id)
            .then(setEvents)
            .catch(console.error)
            .finally(() => setEventsLoading(false));
    }, [session]);

    if (!session?.user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-slate-500">Loading...</div>
            </div>
        );
    }

    const isAdmin = session.user.role === 'admin';
    const now = new Date();
    const upcomingEvents = events.filter((e) => new Date(e.startDate) >= now);
    const pastEvents = events.filter((e) => new Date(e.startDate) < now);

    const handleDeleteConfirm = async () => {
        if (!deleteModalEvent) return;
        setDeleteError('');
        setDeleteLoading(true);
        try {
            await deleteEvent(deleteModalEvent.id);
            setEvents((prev) => prev.filter((e) => e.id !== deleteModalEvent.id));
            setDeleteModalEvent(null);
        } catch (err) {
            setDeleteError((err as Error).message || 'Error al eliminar.');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        {isAdmin ? 'Admin Dashboard' : 'Organization Dashboard'}
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Bienvenido, {session.user.name || session.user.email}
                    </p>
                </div>
                {!isAdmin && (
                    <Link
                        href="/events/new"
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Crear Evento
                    </Link>
                )}
            </div>

            {!isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-2xl font-bold text-indigo-600 mb-2">{events.length}</div>
                        <div className="text-slate-600">Total de Eventos</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-2xl font-bold text-green-600 mb-2">{upcomingEvents.length}</div>
                        <div className="text-slate-600">Próximos Eventos</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-2xl font-bold text-slate-600 mb-2">{pastEvents.length}</div>
                        <div className="text-slate-600">Eventos Pasados</div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                {isAdmin ? (
                    <>
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Administración del Sistema</h2>
                        <div className="space-y-3">
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <div className="font-semibold text-slate-900">Gestionar Organizaciones</div>
                                <div className="text-sm text-slate-600">Crear y administrar cuentas de organizaciones</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <div className="font-semibold text-slate-900">Gestionar Categorías</div>
                                <div className="text-sm text-slate-600">Añadir o eliminar categorías de eventos</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <div className="font-semibold text-slate-900">Ver Todos los Eventos</div>
                                <div className="text-sm text-slate-600">Monitorear todos los eventos del campus</div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Mis Eventos</h2>
                            <Link
                                href={`/organizations/${session.user.id}/edit`}
                                className="text-sm font-semibold text-indigo-600 hover:underline"
                            >
                                Editar perfil de organización →
                            </Link>
                        </div>

                        {eventsLoading ? (
                            <div className="text-slate-500 text-center py-8">Cargando eventos...</div>
                        ) : events.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-slate-500 mb-4">Aún no has creado ningún evento.</p>
                                <Link
                                    href="/events/new"
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors inline-block"
                                >
                                    Crear primer evento
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {events.map((event) => {
                                    const start = new Date(event.startDate);
                                    const isPast = start < now;
                                    return (
                                        <div
                                            key={event.id}
                                            className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                                        >
                                            {event.banner && (
                                                <img
                                                    src={event.banner}
                                                    alt={event.title}
                                                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPast ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'}`}>
                                                        {isPast ? 'Pasado' : 'Próximo'}
                                                    </span>
                                                </div>
                                                <Link href={`/events/${event.id}`} className="font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate block">
                                                    {event.title}
                                                </Link>
                                                <p className="text-sm text-slate-500">
                                                    {start.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })} · {event.location}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <Link
                                                    href={`/events/${event.id}/edit`}
                                                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    onClick={() => { setDeleteModalEvent(event); setDeleteError(''); }}
                                                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal de confirmación de borrado */}
            {deleteModalEvent && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-3">¿Eliminar evento?</h2>
                        <p className="text-slate-600 mb-2">
                            Esta acción no se puede deshacer. Se eliminará:
                        </p>
                        <p className="font-semibold text-slate-800 mb-6">"{deleteModalEvent.title}"</p>
                        {deleteError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                                {deleteError}
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setDeleteModalEvent(null); setDeleteError(''); }}
                                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleteLoading}
                                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {deleteLoading ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}