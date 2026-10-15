<?php

namespace Tests\Feature\Admin;

use App\Models\Payment;
use App\Models\PaymentLink;
use App\Models\Project;
use App\Notifications\PaymentReceived;
use App\Payments\Wompi;
use Database\Seeders\BaseDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OnlinePaymentTest extends TestCase
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

    private function link(int $amount = 500000, ?int $agreed = 1000000): PaymentLink
    {
        $project = Project::factory()->create(['agreed_amount' => $agreed, 'currency' => 'COP']);
        $link = new PaymentLink(['amount' => $amount, 'description' => 'Anticipo del 50 %']);
        $link->forceFill(['project_id' => $project->id, 'currency' => 'COP'])->save();

        return $link;
    }

    /**
     * @param  array<string, mixed>  $transaction
     * @return array<string, mixed>
     */
    private function event(array $transaction, ?string $secret = 'test_events_demo'): array
    {
        $timestamp = 1760000000;
        $checksum = hash('sha256', $transaction['id'].$transaction['status'].$transaction['amount_in_cents'].$timestamp.$secret);

        return [
            'event' => 'transaction.updated',
            'data' => ['transaction' => $transaction],
            'signature' => ['properties' => ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'], 'checksum' => strtoupper($checksum)],
            'timestamp' => $timestamp,
            'environment' => 'test',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transaction(PaymentLink $link, string $status = 'APPROVED', ?int $cents = null): array
    {
        return [
            'id' => '01-1760000000-12345',
            'reference' => $link->newReference(),
            'amount_in_cents' => $cents ?? $link->amountInCents(),
            'currency' => 'COP',
            'status' => $status,
            'payment_method_type' => 'CARD',
        ];
    }

    public function test_the_integrity_signature_matches_the_official_wompi_example()
    {
        config(['services.wompi.integrity_secret' => 'prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6']);

        $this->assertSame(
            '37c8407747e595535433ef8f6a811d853cd943046624a0ec04662b17bbf33bf5',
            Wompi::integritySignature('sk8-438k4-xmxm392-sn2m', 2490000, 'COP'),
        );
    }

    public function test_admins_create_links_within_the_pending_balance()
    {
        $project = Project::factory()->create(['agreed_amount' => 1000000, 'currency' => 'COP']);

        $this->actingAs($this->admin())->post(route('admin.finance.links.store', $project), ['amount' => 1500000, 'description' => 'Todo'])
            ->assertSessionHasErrors('amount');
        $this->actingAs($this->admin())->post(route('admin.finance.links.store', $project), ['amount' => 500000, 'description' => 'Anticipo'])
            ->assertSessionHasNoErrors();

        $this->assertSame('500000.00', PaymentLink::query()->sole()->amount);
        $this->actingAs($this->collaborator())->post(route('admin.finance.links.store', $project), ['amount' => 1000, 'description' => 'x'])
            ->assertForbidden();
    }

    public function test_links_cannot_be_created_without_wompi_keys()
    {
        config(['services.wompi.public_key' => null]);
        $project = Project::factory()->create(['agreed_amount' => 1000000, 'currency' => 'COP']);

        $this->actingAs($this->admin())->post(route('admin.finance.links.store', $project), ['amount' => 500000, 'description' => 'Anticipo'])
            ->assertSessionHasErrors('amount');
    }

    public function test_the_pay_page_sends_signed_data_to_wompi_and_never_the_secrets()
    {
        $link = $this->link();

        $response = $this->get(route('site.pay', $link))->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('site/pay')
            ->where('checkout.url', 'https://checkout.wompi.co/p/')
            ->where('checkout.fields.amount-in-cents', 50000000)
            ->where('checkout.fields.public-key', 'pub_test_demo')
            ->where('checkout.fields.signature:integrity', fn ($sig) => $sig === Wompi::integritySignature(
                $page->toArray()['props']['checkout']['fields']['reference'], 50000000, 'COP',
            ))
            ->where('checkout.sandbox', true));

        $response->assertDontSee('test_integrity_demo')->assertDontSee('test_events_demo');
    }

    public function test_a_signed_approved_event_registers_the_payment_only_once()
    {
        Notification::fake();
        $admin = $this->admin();
        $link = $this->link();
        $event = $this->event($this->transaction($link));

        $this->postJson(route('webhooks.wompi'), $event)->assertOk();
        $this->postJson(route('webhooks.wompi'), $event)->assertOk();

        $payment = Payment::query()->sole();
        $this->assertSame('500000.00', $payment->amount);
        $this->assertSame('payment_link', $payment->method);
        $this->assertSame('paid', $link->refresh()->status);
        $this->assertSame(500000.0, $link->project->finance()['pending']);
        Notification::assertSentToTimes($admin, PaymentReceived::class, 1);
    }

    public function test_events_with_a_bad_signature_or_wrong_amount_do_not_register_payments()
    {
        $link = $this->link();

        $this->postJson(route('webhooks.wompi'), $this->event($this->transaction($link), 'otro_secreto'))->assertUnauthorized();
        $this->postJson(route('webhooks.wompi'), $this->event($this->transaction($link, cents: 100)))->assertOk();
        $this->postJson(route('webhooks.wompi'), $this->event($this->transaction($link, 'DECLINED')))->assertOk();

        $this->assertSame(0, Payment::query()->count());
        $this->assertSame('pending', $link->refresh()->status);
        $this->assertSame('DECLINED', $link->last_transaction_status);
    }

    public function test_returning_from_wompi_confirms_with_the_api_not_with_the_url()
    {
        $link = $this->link();
        $transaction = $this->transaction($link);
        Http::fake(['sandbox.wompi.co/v1/transactions/*' => Http::response(['data' => $transaction])]);

        $this->get(route('site.pay.result', ['paymentLink' => $link, 'id' => $transaction['id']]))
            ->assertRedirect(route('site.pay', $link));

        $this->assertSame('paid', $link->refresh()->status);
        Http::assertSent(fn ($request) => $request->url() === 'https://sandbox.wompi.co/v1/transactions/01-1760000000-12345');

        $this->get(route('site.pay', $link))->assertInertia(fn (Assert $page) => $page->where('link.status', 'paid')->where('checkout', null));
    }

    public function test_cancelled_links_cannot_be_paid()
    {
        $link = $this->link();

        $this->actingAs($this->admin())->patch(route('admin.finance.links.cancel', $link->id))->assertRedirect();
        auth()->guard('web')->logout();

        $this->get(route('site.pay', $link))->assertInertia(fn (Assert $page) => $page->where('link.status', 'cancelled')->where('checkout', null));
    }
}
