<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ActivityRequest;
use App\Models\Activity;
use App\Models\Client;
use App\Models\Lead;
use App\Support\Permissions;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Notas e interacciones registradas a mano sobre clientes (y luego prospectos y proyectos).
 */
class ActivityController extends Controller
{
    /**
     * Tipo en la URL => [modelo, permiso necesario para escribir].
     *
     * @var array<string, array{class-string<Model>, string}>
     */
    private const SUBJECTS = [
        'clientes' => [Client::class, 'clientes.gestionar'],
        'prospectos' => [Lead::class, 'prospectos.gestionar'],
    ];

    public function store(ActivityRequest $request, string $subjectType, int $subjectId): RedirectResponse
    {
        $subject = $this->resolveSubject($request, $subjectType, $subjectId);
        $data = $request->validated();

        $subject->activities()->create([
            'type' => $data['type'],
            'description' => $data['description'],
            'user_id' => $request->user()->id,
            'happened_at' => $data['happened_at'] ?? now(),
        ]);

        // Una llamada, correo, reunión o WhatsApp cuenta como último contacto con el prospecto.
        if ($subject instanceof Lead && $data['type'] !== 'note') {
            $subject->forceFill(['last_contacted_at' => $data['happened_at'] ?? now()])->save();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Registro agregado al historial.']);

        return back();
    }

    /**
     * Solo se borran registros manuales, y solo por su autor o un administrador.
     */
    public function destroy(Request $request, Activity $activity): RedirectResponse
    {
        $user = $request->user();

        abort_unless(array_key_exists($activity->type, Activity::MANUAL_TYPES), 403, 'Los registros automáticos no se pueden borrar.');
        abort_unless($activity->user_id === $user->id || $user->hasRole(Permissions::ROLE_ADMIN), 403);

        $activity->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Registro eliminado.']);

        return back();
    }

    private function resolveSubject(Request $request, string $type, int $id): Model
    {
        abort_unless(isset(self::SUBJECTS[$type]), 404);

        [$class, $permission] = self::SUBJECTS[$type];
        abort_unless($request->user()->can($permission), 403);

        return $class::query()->findOrFail($id);
    }
}
