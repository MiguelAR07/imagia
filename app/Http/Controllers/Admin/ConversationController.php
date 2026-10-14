<?php

namespace App\Http\Controllers\Admin;

use App\Assistant\Assistant;
use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Support\Options;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Conversaciones del asistente del sitio: transcripción, resumen y seguimiento del equipo.
 */
class ConversationController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'attention' => ['nullable', Rule::in(array_keys(ChatSession::ATTENTION))],
            'status' => ['nullable', Rule::in(array_keys(ChatSession::STATUSES))],
        ]);

        $conversations = ChatSession::query()
            ->with('lead:id,name,deleted_at')
            ->withCount(['messages as user_messages_count' => fn ($q) => $q->where('role', 'user')])
            ->when($filters['attention'] ?? null, fn ($q, $v) => $q->where('attention_status', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['q'] ?? null, fn ($q, $term) => $q->where(fn ($w) => $w
                ->where('summary', 'like', "%{$term}%")
                ->orWhereHas('messages', fn ($m) => $m->where('role', 'user')->where('content', 'like', "%{$term}%"))))
            // Las conversaciones vacías (solo el saludo) no aportan nada al equipo.
            ->whereHas('messages', fn ($q) => $q->where('role', 'user'))
            ->latest('last_message_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (ChatSession $s) => [
                'id' => $s->id,
                'summary' => $s->summary,
                'recommendation' => Assistant::RECOMMENDATIONS[$s->answer('recommendation')] ?? null,
                'status' => $s->status,
                'attention_status' => $s->attention_status,
                'engine' => $s->engine,
                'messages_count' => $s->user_messages_count,
                'lead' => $s->lead?->only(['id', 'name']),
                'last_message_at' => $s->last_message_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/conversations/index', [
            'conversations' => $conversations,
            'filters' => [
                'q' => $filters['q'] ?? '',
                'attention' => $filters['attention'] ?? '',
                'status' => $filters['status'] ?? '',
            ],
            'options' => $this->options(),
            'counts' => ChatSession::query()->whereHas('messages', fn ($q) => $q->where('role', 'user'))
                ->selectRaw('attention_status, count(*) as total')->groupBy('attention_status')
                ->pluck('total', 'attention_status'),
        ]);
    }

    public function show(ChatSession $conversation): Response
    {
        $conversation->load(['lead:id,name,email,phone,deleted_at', 'recommendedPlan:id,name,is_published']);

        return Inertia::render('admin/conversations/show', [
            'conversation' => [
                'id' => $conversation->id,
                'summary' => $conversation->summary,
                'recommendation' => Assistant::RECOMMENDATIONS[$conversation->answer('recommendation')] ?? null,
                'plan' => $conversation->recommendedPlan?->only(['id', 'name']),
                'status' => $conversation->status,
                'attention_status' => $conversation->attention_status,
                'engine' => $conversation->engine,
                'lead' => $conversation->lead ? [
                    ...$conversation->lead->only(['id', 'name', 'email', 'phone']),
                    'archived' => $conversation->lead->trashed(),
                ] : null,
                'created_at' => $conversation->created_at?->toIso8601String(),
                'last_message_at' => $conversation->last_message_at?->toIso8601String(),
                'messages' => $conversation->messages()->get()->map(fn (ChatMessage $m) => [
                    'id' => $m->id,
                    'role' => $m->role,
                    'content' => $m->content,
                    'engine' => $m->meta['engine'] ?? null,
                    'created_at' => $m->created_at?->toIso8601String(),
                ]),
            ],
            'activities' => $conversation->activities()->with('user:id,name')->limit(100)->get()
                ->map(fn (Activity $a) => $a->toTimelineArray()),
            'options' => [
                ...$this->options(),
                'activity_types' => Options::from(Activity::MANUAL_TYPES),
            ],
        ]);
    }

    public function update(Request $request, ChatSession $conversation): RedirectResponse
    {
        $data = $request->validate([
            'attention_status' => ['sometimes', Rule::in(array_keys(ChatSession::ATTENTION))],
            'status' => ['sometimes', Rule::in(['open', 'closed'])],
        ]);

        // «Con datos de contacto» lo define el sistema al crear el prospecto; no se cambia a mano.
        if (isset($data['status']) && $conversation->status === 'converted') {
            unset($data['status']);
        }

        $before = $conversation->only(['attention_status', 'status']);
        $conversation->update($data);

        if ($before['attention_status'] !== $conversation->attention_status) {
            $conversation->logActivity('status_change', 'Seguimiento: '.ChatSession::ATTENTION[$conversation->attention_status].'.', $request->user());
        }

        if ($before['status'] !== $conversation->status) {
            $conversation->logActivity('status_change', 'Conversación '.mb_strtolower(ChatSession::STATUSES[$conversation->status]).'.', $request->user());
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Conversación actualizada.']);

        return back();
    }

    /**
     * Borra la conversación y su transcripción (por ejemplo, si el visitante lo pide).
     * El prospecto creado desde ella no se borra.
     */
    public function destroy(ChatSession $conversation): RedirectResponse
    {
        $conversation->activities()->delete();
        $conversation->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Conversación eliminada.']);

        return to_route('admin.conversations.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function options(): array
    {
        return [
            'attention' => Options::from(ChatSession::ATTENTION),
            'statuses' => Options::from(ChatSession::STATUSES),
        ];
    }
}
