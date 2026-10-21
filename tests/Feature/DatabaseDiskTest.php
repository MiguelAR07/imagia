<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DatabaseDiskTest extends TestCase
{
    use RefreshDatabase;

    public function test_files_are_stored_read_and_deleted_in_the_database()
    {
        $disk = Storage::disk('db');
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');

        $disk->put('portfolio/1/a.png', $png);

        $this->assertTrue($disk->exists('portfolio/1/a.png'));
        $this->assertSame($png, $disk->get('portfolio/1/a.png'));
        $this->assertSame('image/png', $disk->mimeType('portfolio/1/a.png'));
        $this->assertSame(strlen($png), $disk->size('portfolio/1/a.png'));
        $this->assertSame(['portfolio/1/a.png'], $disk->allFiles('portfolio'));

        $disk->delete('portfolio/1/a.png');
        $this->assertFalse($disk->exists('portfolio/1/a.png'));
    }

    public function test_uploaded_files_can_be_stored_and_served()
    {
        $path = UploadedFile::fake()->image('foto.jpg', 20, 20)->store('portfolio/9', 'db');

        $this->assertTrue(Storage::disk('db')->exists($path));
        $response = Storage::disk('db')->response($path);
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('image/jpeg', $response->headers->get('Content-Type'));
    }
}
