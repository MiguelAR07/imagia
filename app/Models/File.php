<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Storage;

/**
 * Archivo privado. Nunca se publica en una carpeta pública: se descarga a través de
 * un controlador que valida permisos.
 *
 * @property int $id
 * @property string $fileable_type
 * @property int $fileable_id
 * @property string $disk
 * @property string $path
 * @property string $original_name
 * @property string|null $mime_type
 * @property int $size
 * @property bool $is_shared_with_client
 * @property int|null $uploaded_by
 */
#[Fillable(['disk', 'path', 'original_name', 'mime_type', 'size', 'is_shared_with_client', 'uploaded_by'])]
class File extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['is_shared_with_client' => 'boolean', 'size' => 'integer'];
    }

    protected static function booted(): void
    {
        static::deleted(fn (File $file) => Storage::disk($file->disk)->delete($file->path));
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function fileable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
