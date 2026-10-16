<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentLink;
use App\Models\Project;
use App\Payments\Wompi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Links de pago en línea (Wompi) que se envían al cliente de un proyecto.
 */
class PaymentLinkController extends Controller
{
    public function store(Request $request, Project $project): RedirectResponse
    {
        if (! Wompi::configured()) {
            throw ValidationException::withMessages(['amount' => 'Primero configura las llaves de Wompi en el archivo .env.']);
        }

        if ($project->currency !== 'COP') {
            throw ValidationException::withMessages(['amount' => 'Los pagos con Wompi solo se reciben en pesos colombianos (COP).']);
        }

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:1500', 'max:999999999'],
            'description' => ['required', 'string', 'max:120'],
            'kind' => ['nullable', 'in:balance,other'],
        ], [
            'amount.min' => 'El valor mínimo para cobrar en línea es $1.500.',
        ]);

        $pending = $project->finance()['pending'];
        if ($pending !== null && (float) $data['amount'] > $pending + 0.001) {
            throw ValidationException::withMessages([
                'amount' => 'El valor supera lo que falta por cobrar ($'.number_format($pending, 0, ',', '.').' COP).',
            ]);
        }

        $link = new PaymentLink(['amount' => round((float) $data['amount']), 'description' => $data['description']]);
        $link->forceFill(['project_id' => $project->id, 'kind' => $data['kind'] ?? 'other', 'currency' => 'COP', 'created_by' => $request->user()->id])->save();

        $project->logActivity('system', 'Link de pago creado por $'.number_format((float) $link->amount, 0, ',', '.')." COP · {$link->description}.");
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Link de pago creado. Cópialo y envíaselo al cliente.']);

        return back();
    }

    public function cancel(PaymentLink $paymentLink): RedirectResponse
    {
        abort_if($paymentLink->status !== 'pending', 422, 'Solo se anulan links pendientes.');

        $paymentLink->forceFill(['status' => 'cancelled'])->save();
        $paymentLink->project->logActivity('system', "Link de pago anulado: {$paymentLink->description}.");
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Link de pago anulado.']);

        return back();
    }
}
