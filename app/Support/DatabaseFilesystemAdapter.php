<?php

namespace App\Support;

use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use League\Flysystem\Config;
use League\Flysystem\DirectoryAttributes;
use League\Flysystem\FileAttributes;
use League\Flysystem\FilesystemAdapter;
use League\Flysystem\UnableToReadFile;
use League\Flysystem\UnableToRetrieveMetadata;
use League\MimeTypeDetection\FinfoMimeTypeDetector;

/**
 * Disco de Laravel que guarda los archivos en una tabla de la base de datos.
 * Pensado para archivos pequeños (imágenes del portafolio, adjuntos) en hosting sin disco.
 */
class DatabaseFilesystemAdapter implements FilesystemAdapter
{
    public function __construct(private ConnectionInterface $db, private string $table = 'media_files') {}

    private function query(): Builder
    {
        return $this->db->table($this->table);
    }

    private function row(string $path): ?object
    {
        return $this->query()->where('path', $path)->first();
    }

    public function fileExists(string $path): bool
    {
        return $this->query()->where('path', $path)->exists();
    }

    public function directoryExists(string $path): bool
    {
        return $this->query()->where('path', 'like', rtrim($path, '/').'/%')->exists();
    }

    public function write(string $path, string $contents, Config $config): void
    {
        $mime = (new FinfoMimeTypeDetector)->detectMimeType($path, $contents) ?? 'application/octet-stream';
        $now = now();
        $this->query()->updateOrInsert(['path' => $path], [
            'mime_type' => $mime,
            'size' => strlen($contents),
            'contents' => base64_encode($contents),
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function writeStream(string $path, $contents, Config $config): void
    {
        $this->write($path, (string) stream_get_contents($contents), $config);
    }

    public function read(string $path): string
    {
        $row = $this->row($path);

        if ($row === null) {
            throw UnableToReadFile::fromLocation($path, 'El archivo no existe.');
        }

        return (string) base64_decode($row->contents);
    }

    public function readStream(string $path)
    {
        $stream = fopen('php://temp', 'w+b');
        fwrite($stream, $this->read($path));
        rewind($stream);

        return $stream;
    }

    public function delete(string $path): void
    {
        $this->query()->where('path', $path)->delete();
    }

    public function deleteDirectory(string $path): void
    {
        $this->query()->where('path', 'like', rtrim($path, '/').'/%')->delete();
    }

    public function createDirectory(string $path, Config $config): void
    {
        // Las carpetas no existen por separado: son prefijos de la ruta.
    }

    public function setVisibility(string $path, string $visibility): void {}

    public function visibility(string $path): FileAttributes
    {
        return new FileAttributes($path, null, 'private');
    }

    private function meta(string $path, string $type): object
    {
        $row = $this->query()->where('path', $path)->first(['mime_type', 'size', 'updated_at']);

        if ($row === null) {
            throw UnableToRetrieveMetadata::create($path, $type, 'El archivo no existe.');
        }

        return $row;
    }

    public function mimeType(string $path): FileAttributes
    {
        return new FileAttributes($path, null, null, null, $this->meta($path, 'mime_type')->mime_type);
    }

    public function lastModified(string $path): FileAttributes
    {
        return new FileAttributes($path, null, null, Carbon::parse($this->meta($path, 'last_modified')->updated_at)->getTimestamp());
    }

    public function fileSize(string $path): FileAttributes
    {
        return new FileAttributes($path, (int) $this->meta($path, 'file_size')->size);
    }

    public function listContents(string $path, bool $deep): iterable
    {
        $prefix = $path === '' ? '' : rtrim($path, '/').'/';
        $dirs = [];

        foreach ($this->query()->where('path', 'like', $prefix.'%')->orderBy('path')->get(['path', 'size', 'mime_type', 'updated_at']) as $row) {
            $rest = substr($row->path, strlen($prefix));

            if (! $deep && str_contains($rest, '/')) {
                $dir = $prefix.strstr($rest, '/', true);

                if (! isset($dirs[$dir])) {
                    $dirs[$dir] = true;
                    yield new DirectoryAttributes($dir);
                }

                continue;
            }

            yield new FileAttributes($row->path, (int) $row->size, null, Carbon::parse($row->updated_at)->getTimestamp(), $row->mime_type);
        }
    }

    public function move(string $source, string $destination, Config $config): void
    {
        $this->query()->where('path', $destination)->delete();
        $this->query()->where('path', $source)->update(['path' => $destination, 'updated_at' => now()]);
    }

    public function copy(string $source, string $destination, Config $config): void
    {
        $this->write($destination, $this->read($source), $config);
    }
}
