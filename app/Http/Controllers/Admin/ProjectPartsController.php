<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Deliverable;
use App\Models\File;
use App\Models\Milestone;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Partes de un proyecto: hitos, entregables y archivos.
 */
class ProjectPartsController extends Controller
{
    /** Tipos de archivo permitidos. No se aceptan HTML ni SVG (podrían ejecutar código). */
    private const FILE_MIMES = 'pdf,doc,docx,xls,xlsx,ppt,pptx,odt,ods,txt,csv,png,jpg,jpeg,webp,gif,zip,rar,7z,fig,psd,ai,mp4,mov';

    private const MAX_FILE_KB = 20480;

    /* --------------------------------------------------------------- Hitos */

    public function storeMilestone(Request $request, Project $project): RedirectResponse
    {
        $data = $this->validateMilestone($request);
        $project->milestones()->create([
            ...$data,
            'sort_order' => (int) $project->milestones()->max('sort_order') + 1,
        ]);
        $project->logActivity('system', "Hito agregado: «{$data['name']}».");

        return back();
    }

    public function updateMilestone(Request $request, Project $project, Milestone $milestone): RedirectResponse
    {
        $data = $this->validateMilestone($request);
        $wasCompleted = $milestone->completed_at !== null;
        $completed = $request->boolean('completed');

        $milestone->update([
            ...$data,
            'completed_at' => $completed ? ($milestone->completed_at ?? now()) : null,
        ]);

        if ($completed && ! $wasCompleted) {
            $project->logActivity('system', "Hito cumplido: «{$milestone->name}».");
        }

        return back();
    }

    public function destroyMilestone(Project $project, Milestone $milestone): RedirectResponse
    {
        $milestone->delete();

        return back();
    }

    /* --------------------------------------------------------- Entregables */

    public function storeDeliverable(Request $request, Project $project): RedirectResponse
    {
        $deliverable = $project->deliverables()->create($this->validateDeliverable($request));
        $project->logActivity('system', "Entregable agregado: «{$deliverable->name}».");

        return back();
    }

    public function updateDeliverable(Request $request, Project $project, Deliverable $deliverable): RedirectResponse
    {
        $deliverable->fill($this->validateDeliverable($request));
        $statusChanged = $deliverable->isDirty('status');
        $deliverable->save();

        if ($statusChanged) {
            $project->logActivity('status_change', "Entregable «{$deliverable->name}»: ".Deliverable::STATUSES[$deliverable->status].'.');
        }

        return back();
    }

    public function destroyDeliverable(Project $project, Deliverable $deliverable): RedirectResponse
    {
        $deliverable->delete();

        return back();
    }

    /* ------------------------------------------------------------ Archivos */

    public function storeFile(Request $request, Project $project): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:'.self::MAX_FILE_KB, 'mimes:'.self::FILE_MIMES],
        ], [
            'file.max' => 'El archivo no puede pesar más de 20 MB.',
            'file.mimes' => 'Ese tipo de archivo no está permitido.',
        ]);

        $upload = $request->file('file');
        $path = $upload->store("projects/{$project->id}", config('filesystems.media'));

        $project->files()->create([
            'disk' => config('filesystems.media'),
            'path' => $path,
            'original_name' => mb_substr($upload->getClientOriginalName(), 0, 255),
            'mime_type' => $upload->getMimeType(),
            'size' => $upload->getSize(),
            'uploaded_by' => $request->user()->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Archivo subido.']);

        return back();
    }

    public function downloadFile(Project $project, File $file): StreamedResponse
    {
        abort_unless(Storage::disk($file->disk)->exists($file->path), 404);

        return Storage::disk($file->disk)->download($file->path, $file->original_name);
    }

    public function destroyFile(Project $project, File $file): RedirectResponse
    {
        $file->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Archivo eliminado.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validateMilestone(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'due_date' => ['nullable', 'date'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateDeliverable(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'due_date' => ['nullable', 'date'],
            'status' => ['required', Rule::in(array_keys(Deliverable::STATUSES))],
            'is_visible_to_client' => ['boolean'],
        ]);
    }
}
