<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\QuoteRequest;
use App\Models\Client;
use App\Models\Lead;
use App\Models\PipelineStage;
use App\Models\Plan;
use App\Models\Quote;
use App\Models\QuoteItem;
use App\Models\TaxRate;
use App\Support\Options;
use App\Support\QuoteAcceptance;
use App\Support\QuoteCalculator;
use App\Support\Settings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class QuoteController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(array_keys(Quote::STATUSES))],
        ]);

        $quotes = Quote::query()
            ->with(['client:id,name,deleted_at', 'lead:id,name,company,deleted_at'])
            ->when($filters['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->search($filters['q'] ?? null)
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Quote $q) => [
                'id' => $q->id,
                'number' => $q->number,
                'title' => $q->title,
                'recipient' => $q->recipientName(),
                'status' => $q->status,
                'total' => $q->total,
                'currency' => $q->currency,
                'valid_until' => $q->valid_until?->toDateString(),
                'past_validity' => $q->isPastValidity(),
                'created_at' => $q->created_at?->toIso8601String(),
            ]);

        // Valor de las propuestas abiertas, por moneda (lo cotizado no es dinero recibido).
        $pending = Quote::query()->whereIn('status', Quote::EDITABLE_STATUSES)
            ->selectRaw('currency, sum(total) as amount, count(*) as count')
            ->groupBy('currency')->get();

        return Inertia::render('admin/quotes/index', [
            'quotes' => $quotes,
            'pending' => $pending->map(fn ($r) => ['currency' => $r->currency, 'amount' => (string) $r->amount, 'count' => (int) $r->count]),
            'filters' => ['q' => $filters['q'] ?? '', 'status' => $filters['status'] ?? ''],
            'statuses' => Options::from(Quote::STATUSES),
            'taxRates' => TaxRate::query()->orderBy('name')->get()
                ->map(fn (TaxRate $t) => ['id' => $t->id, 'name' => $t->name, 'rate' => $this->trimRate($t->rate), 'is_default' => $t->is_default]),
        ]);
    }

    public function create(Request $request): Response
    {
        $prefill = $request->validate([
            'client' => ['nullable', 'integer'],
            'lead' => ['nullable', 'integer'],
        ]);

        return Inertia::render('admin/quotes/form', [
            'quote' => null,
            'prefill' => [
                'client_id' => isset($prefill['client']) ? (string) $prefill['client'] : '',
                'lead_id' => isset($prefill['lead']) ? (string) $prefill['lead'] : '',
            ],
            ...$this->formOptions(),
        ]);
    }

    public function store(QuoteRequest $request): RedirectResponse
    {
        $quote = DB::transaction(function () use ($request) {
            $quote = new Quote($this->quoteFields($request->validated()));
            $quote->forceFill(QuoteCalculator::totals($request->validated('items')));
            $quote->number = Quote::nextNumber();
            $quote->status = 'draft';
            $quote->created_by = $request->user()->id;
            $quote->save();
            $this->saveItems($quote, $request->validated('items'));

            return $quote;
        });

        $this->logOnRecipient($quote, "Cotización {$quote->number} creada: «{$quote->title}».");

        Inertia::flash('toast', ['type' => 'success', 'message' => "Cotización {$quote->number} guardada como borrador."]);

        return to_route('admin.quotes.show', $quote);
    }

    public function show(Quote $quote): Response
    {
        $quote->load(['items.taxRate', 'client:id,name,phone,deleted_at', 'lead:id,name,company,phone,client_id,deleted_at', 'plan:id,name', 'project:id,name,quote_id,deleted_at', 'creator:id,name']);

        return Inertia::render('admin/quotes/show', [
            'quote' => $this->detail($quote),
            'statuses' => Options::from(Quote::STATUSES),
        ]);
    }

    public function edit(Quote $quote): Response|RedirectResponse
    {
        if (! $quote->isEditable()) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Una cotización aceptada o rechazada no se edita. Duplícala para hacer una nueva versión.']);

            return to_route('admin.quotes.show', $quote);
        }

        $quote->load('items');

        return Inertia::render('admin/quotes/form', [
            'quote' => [
                ...$quote->only(['id', 'number', 'title', 'scope', 'currency', 'payment_terms', 'exclusions', 'notes']),
                'client_id' => $quote->client_id ? (string) $quote->client_id : '',
                'lead_id' => $quote->lead_id ? (string) $quote->lead_id : '',
                'plan_id' => $quote->plan_id ? (string) $quote->plan_id : '',
                'valid_until' => $quote->valid_until?->toDateString(),
                'items' => $quote->items->map(fn (QuoteItem $i) => [
                    'description' => $i->description,
                    'details' => $i->details,
                    'quantity' => (string) (float) $i->quantity,
                    'unit_price' => (string) (float) $i->unit_price,
                    'discount_percent' => (string) (float) $i->discount_percent,
                    'tax_rate_id' => $i->tax_rate_id ? (string) $i->tax_rate_id : '',
                ]),
            ],
            'prefill' => null,
            ...$this->formOptions(),
        ]);
    }

    public function update(QuoteRequest $request, Quote $quote): RedirectResponse
    {
        abort_unless($quote->isEditable(), 403, 'Esta cotización ya no se puede editar.');

        DB::transaction(function () use ($request, $quote) {
            $quote->fill($this->quoteFields($request->validated()));
            $quote->forceFill(QuoteCalculator::totals($request->validated('items')))->save();
            $quote->items()->delete();
            $this->saveItems($quote, $request->validated('items'));
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cotización actualizada.']);

        return to_route('admin.quotes.show', $quote);
    }

    /**
     * Cambia el estado. Aceptar NO registra pagos: solo marca la propuesta como aceptada.
     */
    public function updateStatus(Request $request, Quote $quote): RedirectResponse
    {
        $status = $request->validate(['status' => ['required', Rule::in(array_keys(Quote::STATUSES))]])['status'];

        if ($status === $quote->status) {
            return back();
        }

        $quote->status = $status;
        $quote->sent_at = in_array($status, ['sent', 'accepted', 'rejected'], true) ? ($quote->sent_at ?? now()) : $quote->sent_at;
        $quote->accepted_at = $status === 'accepted' ? now() : null;
        $quote->save();

        $this->logOnRecipient($quote, "Cotización {$quote->number}: ".Quote::STATUSES[$status].'.');

        // Al enviarla, el prospecto avanza a «Cotización enviada» si esa etapa existe y aún no ha pasado por ella.
        if ($status === 'sent' && $quote->lead) {
            $stage = PipelineStage::query()->where('slug', 'cotizacion-enviada')->first();
            $current = $quote->lead->stage;

            if ($stage && $current && $current->sort_order < $stage->sort_order && ! $current->is_won && ! $current->is_lost) {
                $quote->lead->update(['pipeline_stage_id' => $stage->id]);
                $quote->lead->logActivity('status_change', "Movido a «{$stage->name}» al enviar la cotización {$quote->number}.");
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cotización marcada como «'.Quote::STATUSES[$status].'».']);

        return back();
    }

    public function duplicate(Request $request, Quote $quote): RedirectResponse
    {
        $copy = DB::transaction(function () use ($request, $quote) {
            $copy = $quote->replicate(['number', 'status', 'sent_at', 'accepted_at', 'created_by']);
            $copy->number = Quote::nextNumber();
            $copy->status = 'draft';
            $copy->created_by = $request->user()->id;
            $copy->title = $quote->title;
            $copy->save();

            foreach ($quote->items as $item) {
                $copy->items()->create($item->only(['description', 'details', 'quantity', 'unit_price', 'discount_percent', 'tax_rate_id', 'sort_order']));
            }

            return $copy;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => "Nueva versión {$copy->number} creada como borrador."]);

        return to_route('admin.quotes.edit', $copy);
    }

    /**
     * Crea el proyecto a partir de una cotización aceptada: el valor contratado es el total.
     * Si la cotización era para un prospecto, primero hay que convertirlo en cliente.
     */
    public function createProject(Request $request, Quote $quote): RedirectResponse
    {
        if ($quote->status !== 'accepted') {
            throw ValidationException::withMessages(['status' => 'Solo se crea un proyecto desde una cotización aceptada.']);
        }

        if ($quote->project) {
            return to_route('admin.projects.show', $quote->project);
        }

        // Si la cotización es para un prospecto, se convierte en cliente automáticamente.
        $project = QuoteAcceptance::projectFor($quote, "Proyecto creado desde la cotización {$quote->number}.");

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Proyecto creado con el valor de la cotización.']);

        return to_route('admin.projects.show', $project);
    }

    /**
     * Enlace para que el cliente vea la cotización, la acepte y pague el anticipo.
     * Compartirla la marca como enviada.
     */
    public function share(Quote $quote): RedirectResponse
    {
        $quote->ensurePublicToken();

        if ($quote->status === 'draft') {
            $quote->forceFill(['status' => 'sent', 'sent_at' => now()])->save();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Enlace listo. Cópialo o envíalo por WhatsApp.']);

        return back();
    }

    /** Vista para imprimir o guardar como PDF desde el navegador. */
    public function print(Quote $quote): Response
    {
        $quote->load(['items.taxRate', 'client:id,name,tax_id,email,phone,city,deleted_at', 'lead:id,name,company,email,phone,deleted_at']);

        return Inertia::render('admin/quotes/print', [
            'quote' => $this->detail($quote),
            'recipient' => $quote->client
                ? $quote->client->only(['name', 'tax_id', 'email', 'phone', 'city'])
                : ($quote->lead ? ['name' => $quote->lead->company ?: $quote->lead->name, 'tax_id' => null, 'email' => $quote->lead->email, 'phone' => $quote->lead->phone, 'city' => null] : null),
            'contact' => collect(Settings::get(Settings::CONTACT))->only(['email', 'phone', 'whatsapp', 'city']),
        ]);
    }

    public function destroy(Quote $quote): RedirectResponse
    {
        abort_if($quote->status === 'accepted', 403, 'Una cotización aceptada no se elimina.');

        $quote->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => "Cotización {$quote->number} eliminada."]);

        return to_route('admin.quotes.index');
    }

    /* ------------------------------------------------------------ Impuestos */

    public function storeTaxRate(Request $request): RedirectResponse
    {
        $data = $this->validateTaxRate($request);

        DB::transaction(function () use ($data) {
            if ($data['is_default']) {
                TaxRate::query()->update(['is_default' => false]);
            }
            TaxRate::query()->create($data);
        });

        return back();
    }

    public function updateTaxRate(Request $request, TaxRate $taxRate): RedirectResponse
    {
        $data = $this->validateTaxRate($request);

        DB::transaction(function () use ($data, $taxRate) {
            if ($data['is_default']) {
                TaxRate::query()->whereKeyNot($taxRate->id)->update(['is_default' => false]);
            }
            $taxRate->update($data);
        });

        return back();
    }

    public function destroyTaxRate(TaxRate $taxRate): RedirectResponse
    {
        $taxRate->delete();

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validateTaxRate(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'rate' => ['required', 'numeric', 'between:0,100'],
            'is_default' => ['boolean'],
        ]);
        $data['is_default'] = (bool) ($data['is_default'] ?? false);

        return $data;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function quoteFields(array $data): array
    {
        $fields = collect($data)->except('items')->all();

        return [
            ...$fields,
            // Si es para un cliente, no se guarda también el prospecto.
            'lead_id' => filled($fields['client_id'] ?? null) ? null : ($fields['lead_id'] ?? null),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $items
     */
    private function saveItems(Quote $quote, array $items): void
    {
        foreach (array_values($items) as $i => $item) {
            $quote->items()->create([
                ...$item,
                'discount_percent' => $item['discount_percent'] ?? 0,
                'tax_rate_id' => $item['tax_rate_id'] ?? null,
                'sort_order' => $i,
            ]);
        }
    }

    private function logOnRecipient(Quote $quote, string $message): void
    {
        $quote->client?->logActivity('system', $message);
        $quote->lead?->logActivity('system', $message);
    }

    /**
     * @return array<string, mixed>
     */
    private function detail(Quote $quote): array
    {
        return [
            ...$quote->only(['id', 'number', 'title', 'scope', 'status', 'currency', 'subtotal', 'discount_amount', 'tax_amount', 'total', 'payment_terms', 'exclusions', 'notes']),
            'valid_until' => $quote->valid_until?->toDateString(),
            'sent_at' => $quote->sent_at?->toIso8601String(),
            'accepted_at' => $quote->accepted_at?->toIso8601String(),
            'created_at' => $quote->created_at?->toIso8601String(),
            'created_by' => $quote->creator?->name,
            'recipient' => $quote->recipientName(),
            'client' => $quote->client?->only(['id', 'name']),
            'lead' => $quote->lead ? ['id' => $quote->lead->id, 'name' => $quote->lead->name, 'client_id' => $quote->lead->client_id] : null,
            'plan' => $quote->plan?->only(['id', 'name']),
            'project' => $quote->project?->only(['id', 'name']),
            'editable' => $quote->isEditable(),
            'past_validity' => $quote->isPastValidity(),
            'public_url' => $quote->public_token ? route('site.quote.view', $quote->public_token) : null,
            'recipient_phone' => $quote->client?->phone ?? $quote->lead?->phone,
            'deposit' => [
                'percent' => Quote::DEPOSIT_PERCENT,
                'amount' => $quote->depositAmount(),
                'link' => $quote->paymentLinks()->where('kind', 'deposit')->latest()->first()?->only(['status', 'paid_at', 'last_transaction_status']),
            ],
            'items' => $quote->items->map(fn (QuoteItem $i) => [
                'id' => $i->id,
                'description' => $i->description,
                'details' => $i->details,
                'quantity' => $i->quantity,
                'unit_price' => $i->unit_price,
                'discount_percent' => $i->discount_percent,
                'tax' => $i->taxRate ? $i->taxRate->name.' ('.(float) $i->taxRate->rate.' %)' : null,
                'line_total' => round((float) $i->quantity * (float) $i->unit_price * (1 - (float) $i->discount_percent / 100), 2),
            ]),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'clients' => Client::query()->orderBy('name')->get(['id', 'name'])
                ->map(fn (Client $c) => ['value' => (string) $c->id, 'label' => $c->name]),
            'leads' => Lead::query()->whereNull('client_id')->latest()->limit(200)->get(['id', 'name', 'company'])
                ->map(fn (Lead $l) => ['value' => (string) $l->id, 'label' => $l->company ? "{$l->name} · {$l->company}" : $l->name]),
            'plans' => Plan::query()->with(['features' => fn ($q) => $q->wherePivot('kind', 'included')])->orderBy('sort_order')->get()
                ->map(fn (Plan $p) => [
                    'value' => (string) $p->id,
                    'label' => $p->name,
                    'price' => $p->price,
                    'price_type' => $p->price_type,
                    'features' => $p->features->pluck('name'),
                    'exclusions' => $p->exclusions,
                ]),
            'tax_rates' => TaxRate::query()->orderBy('name')->get()
                ->map(fn (TaxRate $t) => ['value' => (string) $t->id, 'label' => "{$t->name} ({$this->trimRate($t->rate)} %)", 'rate' => (float) $t->rate, 'is_default' => $t->is_default]),
        ];
    }

    private function trimRate(string $rate): string
    {
        return rtrim(rtrim($rate, '0'), '.');
    }
}
