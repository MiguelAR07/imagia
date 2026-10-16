<?php

namespace Tests\Feature\Site;

use App\Models\Client;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\PaymentLink;
use App\Models\Project;
use App\Models\Quote;
use App\Notifications\PaymentLinkForClient;
use App\Notifications\QuoteForClient;
use Database\Seeders\BaseDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class QuoteDepositTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(BaseDataSeeder::class);
        config([
            'services.wompi.public_key' => 'pub_test_demo',
            'services.wompi.integrity_secret' => 'test_integrity_demo',
            'services.wompi.events_secret' => 'test_events_demo',
        ]);
    }

    /**
     * @param  array<string, mixed>  $recipient
     */
    private function quote(array $recipient = []): Quote
    {
        $this->actingAs($this->admin())->post(route('admin.quotes.store'), [
            ...($recipient ?: ['client_id' => Client::factory()->create()->id]),
            'title' => 'Sistema de agenda',
            'currency' => 'COP',
            'items' => [['description' => 'Desarrollo', 'quantity' => 1, 'unit_price' => 3000000]],
        ]);

        return Quote::query()->latest('id')->firstOrFail();
    }

    private function shared(Quote $quote): Quote
    {
        $this->actingAs($this->admin())->post(route('admin.quotes.share', $quote))->assertRedirect();
        auth()->logout();

        return $quote->refresh();
    }

    /**
     * @return array<string, mixed>
     */
    private function event(PaymentLink $link): array
    {
        $transaction = [
            'id' => '01-1760000000-777',
            'reference' => $link->newReference(),
            'amount_in_cents' => $link->amountInCents(),
            'currency' => 'COP',
            'status' => 'APPROVED',
            'payment_method_type' => 'NEQUI',
        ];
        $timestamp = 1760000000;

        return [
            'event' => 'transaction.updated',
            'data' => ['transaction' => $transaction],
            'signature' => [
                'properties' => ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'],
                'checksum' => hash('sha256', $transaction['id'].'APPROVED'.$transaction['amount_in_cents'].$timestamp.'test_events_demo'),
            ],
            'timestamp' => $timestamp,
        ];
    }

    public function test_sharing_creates_a_private_link_and_marks_the_quote_as_sent()
    {
        $quote = $this->shared($this->quote());

        $this->assertSame('sent', $quote->status);
        $this->assertSame(32, strlen($quote->public_token));

        $this->get(route('site.quote.view', $quote->public_token))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('site/quote-view')
                ->where('quote.number', $quote->number)
                ->where('deposit.amount', 1500000)
                ->where('deposit.payable', true));
    }

    public function test_drafts_and_unknown_tokens_are_not_visible()
    {
        $quote = $this->quote();
        $quote->ensurePublicToken();

        $this->get(route('site.quote.view', $quote->public_token))->assertNotFound();
        $this->get(route('site.quote.view', str_repeat('a', 32)))->assertNotFound();
    }

    public function test_accepting_creates_one_deposit_link_and_goes_to_payment()
    {
        $quote = $this->shared($this->quote());

        $this->post(route('site.quote.accept', $quote->public_token))->assertRedirect();
        $this->post(route('site.quote.accept', $quote->public_token))->assertRedirect();

        $link = PaymentLink::query()->sole();
        $this->assertSame('deposit', $link->kind);
        $this->assertSame($quote->id, $link->quote_id);
        $this->assertNull($link->project_id);
        $this->assertSame('1500000.00', $link->amount);
        $this->get(route('site.pay', $link))->assertOk();
    }

    public function test_paying_the_deposit_accepts_the_quote_converts_the_lead_and_creates_the_project()
    {
        $lead = Lead::factory()->create();
        $quote = $this->shared($this->quote(['lead_id' => $lead->id]));
        $this->post(route('site.quote.accept', $quote->public_token));
        $link = PaymentLink::query()->sole();

        $event = $this->event($link);
        $this->postJson(route('webhooks.wompi'), $event)->assertOk();
        $this->postJson(route('webhooks.wompi'), $event)->assertOk();

        $quote->refresh();
        $project = Project::query()->sole();
        $this->assertSame('accepted', $quote->status);
        $this->assertSame($quote->id, $project->quote_id);
        $this->assertSame('3000000.00', $project->agreed_amount);
        $this->assertNotNull($lead->refresh()->client_id);
        $this->assertSame($lead->client_id, $project->client_id);
        $this->assertSame(1, Payment::query()->count());
        $this->assertEquals(1500000, $project->finance()['pending']);
        $this->assertSame('paid', $link->refresh()->status);
        $this->assertSame($project->id, $link->project_id);

        // Ya pagado: la cotización no se puede volver a pagar.
        $this->get(route('site.quote.view', $quote->public_token))
            ->assertInertia(fn (Assert $page) => $page->where('deposit.paid', true)->where('deposit.payable', false));
        $this->post(route('site.quote.accept', $quote->public_token))->assertStatus(422);
    }

    public function test_the_final_balance_link_is_marked_as_balance_and_emailed_to_the_client()
    {
        Notification::fake();
        $client = Client::factory()->create(['email' => 'cliente@ejemplo.com']);
        $project = Project::factory()->create(['client_id' => $client->id, 'agreed_amount' => 2000000, 'currency' => 'COP']);

        $this->actingAs($this->admin())->post(route('admin.finance.links.store', $project), [
            'amount' => 2000000,
            'description' => 'Saldo final (entrega del proyecto)',
            'kind' => 'balance',
            'send_email' => true,
        ])->assertSessionHasNoErrors();

        $link = PaymentLink::query()->sole();
        $this->assertSame('balance', $link->kind);
        Notification::assertSentOnDemand(PaymentLinkForClient::class, fn ($n, $c, $notifiable) => $notifiable->routes['mail'] === 'cliente@ejemplo.com'
            && $n->link->is($link));

        $this->actingAs($this->admin())->post(route('admin.finance.links.email', $link->id))->assertSessionHasNoErrors();
        Notification::assertSentOnDemandTimes(PaymentLinkForClient::class, 2);
    }

    public function test_the_quote_can_be_emailed_to_the_client_with_its_private_link()
    {
        Notification::fake();
        $quote = $this->quote(['client_id' => Client::factory()->create(['email' => 'cliente@ejemplo.com'])->id]);

        $this->actingAs($this->admin())->post(route('admin.quotes.share', $quote), ['email' => true])->assertSessionHasNoErrors();

        $quote->refresh();
        $this->assertSame('sent', $quote->status);
        Notification::assertSentOnDemand(QuoteForClient::class, function (QuoteForClient $n, $c, $notifiable) use ($quote) {
            $mail = $n->toMail($notifiable);

            return $notifiable->routes['mail'] === 'cliente@ejemplo.com'
                && $mail->actionUrl === route('site.quote.view', $quote->public_token);
        });
    }

    public function test_emailing_a_quote_without_an_email_shows_an_error()
    {
        Notification::fake();
        $quote = $this->quote(['client_id' => Client::factory()->create(['email' => null])->id]);

        $this->actingAs($this->admin())->post(route('admin.quotes.share', $quote), ['email' => true])->assertSessionHasErrors('email');

        $this->assertSame('draft', $quote->refresh()->status);
        Notification::assertNothingSent();
    }
}
