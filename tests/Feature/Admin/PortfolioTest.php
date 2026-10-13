<?php

namespace Tests\Feature\Admin;

use App\Models\PortfolioItem;
use App\Models\Technology;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PortfolioTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_replace([
            'title' => 'Sistema de citas para spa',
            'category' => 'management',
            'summary' => 'Agenda en línea con recordatorios.',
            'highlights' => ['Agenda por terapeuta', ''],
            'technologies' => ['Laravel', 'React', 'laravel '],
            'testimonials' => [],
        ], $overrides);
    }

    private function itemWithCover(array $attributes = []): PortfolioItem
    {
        $item = PortfolioItem::query()->create([
            'title' => 'Proyecto',
            'slug' => 'proyecto-'.uniqid(),
            'category' => 'website',
            'summary' => 'Resumen',
            'status' => 'draft',
            ...$attributes,
        ]);
        Storage::disk('local')->put("portfolio/{$item->id}/portada.jpg", 'imagen');
        $item->update(['cover_path' => "portfolio/{$item->id}/portada.jpg"]);

        return $item;
    }

    public function test_new_items_are_drafts_and_technologies_are_reused()
    {
        Technology::query()->create(['name' => 'Laravel']);

        $this->actingAs($this->admin())
            ->post(route('admin.portfolio.store'), $this->payload())
            ->assertSessionHasNoErrors();

        $item = PortfolioItem::query()->firstOrFail();
        $this->assertSame('draft', $item->status);
        $this->assertSame(['Agenda por terapeuta'], $item->highlights);
        $this->assertSame(2, Technology::query()->count(), 'No duplica «Laravel»');
        $this->assertSame(['Laravel', 'React'], $item->technologies()->pluck('name')->all());
    }

    public function test_an_item_without_cover_cannot_be_published()
    {
        $item = PortfolioItem::query()->create(['title' => 'X', 'slug' => 'x', 'category' => 'website', 'summary' => 'Y', 'status' => 'draft']);

        $this->actingAs($this->admin())->patch(route('admin.portfolio.publish', $item), ['published' => true]);

        $this->assertSame('draft', $item->fresh()->status);
    }

    public function test_draft_and_confidential_images_are_hidden_from_visitors()
    {
        $draft = $this->itemWithCover();
        $confidential = $this->itemWithCover(['status' => 'published', 'is_confidential' => true]);
        $public = $this->itemWithCover(['status' => 'published']);

        $this->get(route('portfolio.cover', $draft))->assertNotFound();
        $this->get(route('portfolio.cover', $confidential))->assertNotFound();
        $this->get(route('portfolio.cover', $public))->assertOk();

        // Quien administra el catálogo sí ve los borradores.
        $this->actingAs($this->admin())->get(route('portfolio.cover', $draft))->assertOk();
    }

    public function test_publishing_a_confidential_item_warns_that_it_stays_hidden()
    {
        $item = $this->itemWithCover(['is_confidential' => true]);

        $this->actingAs($this->admin())->patch(route('admin.portfolio.publish', $item), ['published' => true]);

        $this->assertSame('published', $item->fresh()->status);
        $this->assertFalse($item->fresh()->isPublic());
    }

    public function test_testimonials_need_an_authorization_date_to_be_published()
    {
        $admin = $this->admin();
        $testimonial = ['author_name' => 'Andrea', 'quote' => 'Excelente trabajo.', 'is_published' => true];

        $this->actingAs($admin)
            ->post(route('admin.portfolio.store'), $this->payload(['testimonials' => [$testimonial]]))
            ->assertSessionHasErrors('testimonials.0.authorized_at');

        $this->actingAs($admin)
            ->post(route('admin.portfolio.store'), $this->payload(['testimonials' => [[...$testimonial, 'authorized_at' => today()->toDateString()]]]))
            ->assertSessionHasNoErrors();

        $this->assertSame(1, PortfolioItem::query()->firstOrFail()->testimonials()->where('is_published', true)->count());
    }

    public function test_only_images_are_accepted_for_the_gallery()
    {
        $item = $this->itemWithCover();
        $admin = $this->admin();

        $this->actingAs($admin)
            ->post(route('admin.portfolio.images.store', $item), ['images' => [UploadedFile::fake()->create('virus.exe', 10)]])
            ->assertSessionHasErrors('images.0');

        $this->actingAs($admin)
            ->post(route('admin.portfolio.images.store', $item), ['images' => [UploadedFile::fake()->image('pantalla.png', 800, 500)]])
            ->assertSessionHasNoErrors();

        $image = $item->images()->firstOrFail();
        Storage::disk('local')->assertExists($image->path);

        $this->actingAs($admin)->delete(route('admin.portfolio.images.destroy', ['item' => $item, 'image' => $image]));
        Storage::disk('local')->assertMissing($image->path);
    }

    public function test_duplicating_creates_a_draft_copy_without_images()
    {
        $item = $this->itemWithCover(['status' => 'published', 'is_featured' => true]);

        $this->actingAs($this->admin())->post(route('admin.portfolio.duplicate', $item));

        $copy = PortfolioItem::query()->whereKeyNot($item->id)->firstOrFail();
        $this->assertSame('draft', $copy->status);
        $this->assertNull($copy->cover_path);
        $this->assertFalse($copy->is_featured);
        $this->assertStringContainsString('(copia)', $copy->title);
    }

    public function test_collaborators_cannot_manage_the_portfolio()
    {
        $this->actingAs($this->collaborator())->get(route('admin.portfolio.index'))->assertForbidden();
    }
}
