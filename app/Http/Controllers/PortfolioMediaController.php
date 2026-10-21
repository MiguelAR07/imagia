<?php

namespace App\Http\Controllers;

use App\Models\PortfolioImage;
use App\Models\PortfolioItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Sirve las imágenes del portafolio. Un visitante solo ve las de proyectos públicos;
 * quien administra el catálogo las ve siempre (para editar borradores).
 */
class PortfolioMediaController extends Controller
{
    public function cover(Request $request, PortfolioItem $item): StreamedResponse
    {
        $this->authorizeView($request, $item);
        abort_if($item->cover_path === null, 404);

        return $this->stream($item->cover_path, $item->isPublic());
    }

    public function image(Request $request, PortfolioImage $image): StreamedResponse
    {
        $item = $image->item;
        abort_if($item === null, 404);
        $this->authorizeView($request, $item);

        return $this->stream($image->path, $item->isPublic());
    }

    private function authorizeView(Request $request, PortfolioItem $item): void
    {
        if ($item->isPublic()) {
            return;
        }

        abort_unless($request->user()?->can('catalogo.gestionar') ?? false, 404);
    }

    private function stream(string $path, bool $public): StreamedResponse
    {
        abort_unless(Storage::disk(config('filesystems.media'))->exists($path), 404);

        return Storage::disk(config('filesystems.media'))->response($path, null, [
            'Cache-Control' => $public ? 'public, max-age=86400' : 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
